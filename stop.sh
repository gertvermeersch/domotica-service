#!/bin/sh

kill $(ps aux | grep "[n]ode App.js" | awk '{print $2}')


