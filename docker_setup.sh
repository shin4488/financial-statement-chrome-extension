#!/bin/bash

MODULE_DIR=/home/app/financialStatementChromeExtention/node_modules

if [ ! -d $MODULE_DIR ] || [ -z "$(ls $MODULE_DIR)" ]; then
  yarn install
fi

yarn watch &
yarn dev --host
