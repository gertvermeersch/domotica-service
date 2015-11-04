#!/bin/sh

nohup node App.js --ssl=true --port=8443 & > /dev/null
