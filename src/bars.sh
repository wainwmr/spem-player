#!/bin/bash

grep -B 2 '<tspan>[0-9]*</tspan>' $1 | sed -n 's/^.*translate(\([^,]*\),.*$/\1/p' | sort -n | sed 's/$/, /' | tr -d '\n' | sed 's/\,$//'