const path = require('path');
const fs = require('fs');

function TSResolve (typescript, sourceFolder, destFolder) {

  return {
		resolveId: function resolveId ( importee, importer ) {

      // Nur pfade resolven, die zu dateien gehören, die TypeScript auch angefasst hat
			if (!importer || importer.indexOf(path.join(process.cwd(), destFolder)) !== 0) {
        return null;
      }

			if (importee === '\0typescript-helpers') {
				return '\0typescript-helpers';
			}

      function compilerOptionsFromTsConfig ( typescript ) {
        var tsconfig = typescript.readConfigFile(path.join(process.cwd(), 'tsconfig.json'), function (path) { return fs.readFileSync( path, 'utf8' ); } );
        if ( !tsconfig.config || !tsconfig.config.compilerOptions ) return {};
        return tsconfig.config && tsconfig.config.compilerOptions;
      }

	    const options = compilerOptionsFromTsConfig(typescript);
      options.noEmitHelpers = true;
      options.module = 'es2015';
      options.sourceMap = true;
      
      const parsed = typescript.convertCompilerOptionsFromJson( options, process.cwd() );
      if ( parsed.errors.length ) {
        parsed.errors.forEach( error => console.error( `TSResolve: ${ error.messageText }` ) );
        throw new Error( `TSResolve: Couldn't process compiler options` );
      }

			var result = typescript.nodeModuleNameResolver( importee, importer.split('\\').join('/'), parsed.options, {
        directoryExists: function directoryExists ( dirPath ) {
          try {
            return fs.statSync( dirPath ).isDirectory();
          } catch ( err ) {
            return false;
          }
        },
        fileExists: function fileExists ( filePath ) {
          try {
            return fs.statSync( filePath ).isFile();
          } catch ( err ) {
            return false;
          }
        }
      });

      function endsWith (str, tail) {
        return !tail.length || str.slice( -tail.length ) === tail;
      }

			if ( result.resolvedModule && result.resolvedModule.resolvedFileName && !endsWith( result.resolvedModule.resolvedFileName, '.d.ts')) {
        return result.resolvedModule.resolvedFileName.replace(`/${sourceFolder}/`, `/${destFolder}/${sourceFolder}/`).replace('.ts', '.js');
			}

			return null;
		}
  }
};

module.exports = TSResolve;