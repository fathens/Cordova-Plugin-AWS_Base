#!/usr/bin/env node

const fs = require('fs');
const xml2js = require('xml2js');

const variable_names = process.argv.slice(2);

const client = process.cwd().split('/').reverse()[0];
console.log(`Working for ${client} with ${variable_names.join(', ')}`);

const target_file = "../../www/index.html";

function build_variables() {
    const tab = ' '.repeat(4);
    const lines = variable_names.map((key) => {
        const value = process.env[key];
        if (!value) throw `Unknown environment variable: ${key}`;
        return `${tab}const ${key} = '${value}';`;
    });
    return `\n${lines.join('\n')}\n`;
}

function inject_awssdk(scripts) {
    const found = scripts.find((e) => {
        if (e.$.src) {
            return e.$.src.startsWith('https://sdk.amazonaws.com/js/aws-sdk-');
        }
    });
    if (!found) {
        scripts.unshift({
            $: {
                type: 'javascript',
                src: 'https://sdk.amazonaws.com/js/aws-sdk-2.6.10.min.js'
            }
        });
    }
}

function inject_variables(scripts) {
    if (!scripts.find((e) => { e.$.by === client })) {
        scripts.push({
            $: {
                type: 'javascript',
                by: client
            },
            _: build_variables()
        });
    }
}

function modify(html) {
    const scripts = html.head.script;
    if (!scripts) scripts = [];
    
    inject_awssdk(scripts);
    inject_variables(scripts);
}

fs.stat(target_file, (err, stats) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.log("No target: " + target_file);
        } else {
            throw err;
        }
    } else {
        if (stats.isFile()) {
            fs.readFile(target_file, 'utf-8', (err, data) => {
                if (err) throw err;
                xml2js.parseString(data, (err, xml) => {
                    if (err) throw err;
                    modify(xml);
                });
            });
        }
    }
});
