'use strict';

module.exports = class FileEx{
	static is_exist_file(filepath){
		const fs = require('fs');
		try{
			fs.accessSync(filepath);
			return true;
		}catch(err){
			console.debug(err);
			return false;
		}
	}

	static touch(filepath){
		const fs = require('fs');
		fs.writeFileSync(filepath, "");
	}

	static join(path1, path2){
		const path = require('path');
		return path.join(path1, path2);
	}

	static read_textfile(filepath){
		const fs = require('fs');
		try{
			const t = fs.readFileSync(filepath, 'utf8');
			return t;
		}catch(err){
			console.debug(err);
			return null;
		}
	}

	static read_json(filepath){
		const t = FileEx.read_textfile(filepath);
		if(null === t){
			return {};
		}
		return JSON.parse(t);
	}
}

