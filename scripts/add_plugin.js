#!/usr/bin/env node

const fs = require('fs');
const xml2js = require('xml2js');

const plugin_id = process.argv[2]
const gitrepo = process.argv[3]
const target_file = '../../config.xml';

function modify(xml) {
    const elem = {
        $: {
            name: plugin_id,
            spec: gitrepo
        },
        variable: [
            {
                $: {
                    name: "AWS_REGION",
                    value: process.env.AWS_REGION
                }
            },
            {
                $: {
                    name: "AWS_COGNITO_IDENTITY_POOL",
                    value: process.env.AWS_COGNITO_IDENTITY_POOL
                }
            }
        ]
    };
    
    if (!xml.widget.plugin) xml.widget.plugin = [];
    xml.widget.plugin.push(elem);
    
    const builder = new xml2js.Builder();
    const modified = builder.buildObject(xml);
    
    fs.writeFile(target_file, modified, 'utf-8', (err) => {
        if (err) throw err;
        console.log("Added plugin: " + plugin_id);
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
