
.PHONY: all run clean

all:
	# NOP
	exit 1

run:
	cd daisy_spread_image && npm run running

clean:
	cd daisy_spread_image && npm run clean
	rm -rf release/release

.PHONY: test ci-test
ci-test:
	make test
	#make package

test:
	cd daisy_spread_image && npm run test test/$(ARG)

.PHONY: package package_desktop
package: package_desktop

package_desktop:
	rm -rf daisy_spread_image/node_modules
	#cd daisy_spread_image && npm install # audit command depend npm version 6
	cd daisy_spread_image && npm install && npm audit fix
	make test
	bash ./release/installer_win32_x64.sh
	bash ./release/installer_darwin.sh
	bash ./release/installer_debian.sh

