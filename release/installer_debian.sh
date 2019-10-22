#!/bin/bash
#
# Author: michinari.nukazawa@gmail.com
#

set -eu
set -o pipefail

trap 'echo "error:$0($LINENO) \"$BASH_COMMAND\" \"$@\""' ERR

# cd daisy_spread_image && npm run installer_debian_amd64
# "installer_debian_amd64": "node ./build_linux_x64.js && electron-installer-debian --config ./installer_debian_amd64_config.json",
pushd ../daisy_spread_image/daisy_spread_image
npm run pack:linux
npm run debian_installer_debian
popd

