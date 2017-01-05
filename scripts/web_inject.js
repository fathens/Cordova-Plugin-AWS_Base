#!/usr/bin/env node

const fs = require('fs');
const himalaya = require('himalaya');

const variable_names = process.argv.slice(2);

const package_json = JSON.parse(fs.readFileSync('./package.json'));
const client = `${package_json.name}@${package_json.version}`;
console.log(`Working for ${client} with [${variable_names.join(', ')}]`);

const target_file = "./www/index.html";

function build_variables() {
    const tab = ' '.repeat(4);
    const lines = variable_names.map((key) => {
        const value = process.env[key];
        if (!value) throw `Unknown environment variable: ${key}`;
        return `${tab}const ${key} = '${value}';`;
    }).join('\n');
    return `\n${lines}\n`;
}

function inject_awssdk(scripts) {
    const found = scripts.find((e) => {
        if (e.attributes.src) {
            return e.attributes.src.startsWith('https://sdk.amazonaws.com/js/aws-sdk-');
        }
    });
    if (found) return null;

    return {
        tagName: "script",
        type: "Element",
        content: "",
        attributes: {
            src: 'https://sdk.amazonaws.com/js/aws-sdk-2.6.10.min.js'
        }
    };
}

function inject_variables(scripts) {
    if (variable_names.length < 1) return null;
    if (scripts.find((e) => { return e.attributes.by === client })) return null;

    return {
        tagName: "script",
        type: "Element",
        attributes: {
            type: 'text/javascript',
            by: client
        },
        content: build_variables()
    };
}

function inject_credential(scripts) {
    const owner = `credential#${client}`;
    if (scripts.find((e) => { return e.attributes.by === owner })) return null;

    return {
        tagName: "script",
        type: "Element",
        attributes: {
            type: 'text/javascript',
            by: owner
        },
        content: `
        AWS.config.region = AWS_REGION;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: AWS_COGNITO_POOL_ID
        });
        AWS.config.credentials.get((err) => {
            console.log("AWS Credential refreshed. error=" + err);
            if (err) {
                console.log("Retry to initialize cognito by clearing identityId...");
                AWS.config.credentials.params.IdentityId = null;
                AWS.config.credentials.get((err) => {
                    console.log("AWS Credential refreshed. error=" + err);
                });
            }
        });
`
    };
}

function modify(data) {
    const json = himalaya.parse(data);
    
    const html = json.find((e) => { return e.tagName === 'html' });
    const head = html.children.find((e) => { return e.tagName === 'head' });
    var scripts = head.children.filter((e) => { return e.tagName === 'script' });
    if (!scripts) scripts = [];
    
    const sdk = inject_awssdk(scripts);
    const vals = inject_variables(scripts);
    const cred = inject_credential(scripts);
    
    if (sdk || vals || cred) {
        if (sdk) head.children.push(sdk);
        if (vals) head.children.push(vals);
        if (cred) head.children.push(cred);
        
        return require('himalaya/translate').toHTML(json);
    }
}

fs.stat(target_file, (err, stats) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.log(`No target: '${target_file}'`);
        } else {
            throw err;
        }
    } else {
        if (stats.isFile()) {
            fs.readFile(target_file, 'utf-8', (err, data) => {
                if (err) throw err;
                const result = modify(data);
                if (result) {
                    fs.writeFile(target_file, result, 'utf-8', (err, data) => {
                        if (err) throw err;
                        console.log(`Wrote to '${target_file}'`);
                    });
                } else {
                    console.log(`No need to modify '${target_file}'`);
                }
            });
        }
    }
});
