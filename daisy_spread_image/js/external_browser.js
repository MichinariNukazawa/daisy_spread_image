'use strict';

module.exports = class ExternalBrowser{
	static open(link){
		require('electron').shell.openExternal(link)
	}
};

