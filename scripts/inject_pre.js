#!/usr/bin/env node

const fs = require('fs');

const variable_names = process.argv.slice(2);

const script_name = "prestart";
const target_file = "../../package.json";

function modify(data) {
    const json = JSON.parse(data);
    
    if (!json.scripts) json.scripts = {};
    
    const line = json.scripts[script_name];
    if (line) {
        const regex = /([^\w]?web_inject )([\w ]+)/;
        const injecting = line.match(regex);
        if (injecting) {
            const injects = injecting[2].split(' ');
            const keys = injecting.concat(variable_names).filter((x, index, list) => {
                return list.indexOf(x) === index;
            });
            if (injects.length < keys.length) {
                json.scripts[script_name] = line.replace(regex, (m, p1, p2) => {
                    return p1 + keys.join(' ');
                });
            } else {
                return null;
            }
        } else {
            json.scripts[script_name] = line + "; web_inject" + variable_names.join(' ');
        }
    } else {
        json.scripts[script_name] = "web_inject " + variable_names.join(' ');
    }
    return JSON.stringify(json, null, 2);
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
