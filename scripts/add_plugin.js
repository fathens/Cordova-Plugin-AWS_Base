#!/usr/bin/env node

const variable_names = process.argv.slice(2);
console.log(`Working on ${process.cwd()} with [${variable_names}]`);

const fs = require('fs');
const xml2js = require('xml2js');

const target_file = '../../../config.xml';

function lazy_variables() {
    return variable_names.map((key) => {
        const value = process.env[key];
        if (!value) throw `Unknown environment variable: ${key}`;
        return {
            $: {
                name: key,
                value: value
            }
        };
    });
}

function read_gitrepo(callback) {
   fs.readFile('./package.json', 'utf-8', (err, data) => {
       if (err) throw err;
       const json = JSON.parse(data);
       callback(json.repository.url);
   });
}

function read_plugin_id(callback) {
    fs.readFile('./plugin.xml', 'utf-8', (err, data) => {
        if (err) throw err;
        xml2js.parseString(data, (err, xml) => {
            if (err) throw err;
            callback(xml.plugin.$.id);
        });
    });
}


function modify(xml) {
    read_plugin_id((plugin_id) => {
        read_gitrepo((gitrepo) => {
            console.log(`plugin_id=${plugin_id}, repo=${gitrepo}`);
            const elem = {
                $: {
                    name: plugin_id,
                    spec: gitrepo
                },
                variable: lazy_variables()
            };
            
            if (!xml.widget.plugin) xml.widget.plugin = [];
            xml.widget.plugin.push(elem);
            
            const builder = new xml2js.Builder();
            const modified = builder.buildObject(xml);
            
            fs.writeFile(target_file, modified, 'utf-8', (err) => {
                if (err) throw err;
                console.log("Added plugin: " + plugin_id);
            });
        });
    });
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
