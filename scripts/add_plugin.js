#!/usr/bin/env node

const fs = require('fs');
const xml2js = require('xml2js');

const package_json_file = 'package.json';
const plugin_xml_file = 'plugin.xml';
const target_file = '../../config.xml';

const variables = process.argv.slice(2).map((key) => {
    return {
        $: {
            name: key,
            value: process.env[key]
        }
    };
});

const gitrepo = require(package_json_file).repository.url;

function read_plugin_id(callback) {
    fs.readFile(plugin_xml_file, 'utf-8', (err, data) => {
        if (err) throw err;
        xml2js.parseString(data, (err, xml) => {
            if (err) throw err;
            callback(xml.plugin.$.id);
        });
    });
}


function modify(xml) {
    read_plugin_id((plugin_id) => {
        const elem = {
            $: {
                name: plugin_id,
                spec: gitrepo
            },
            variable: variables
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
