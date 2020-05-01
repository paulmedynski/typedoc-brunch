// *********************************************************************
// Copyright 2018 Healthy Bytes Technology & Wellness
//
// A TypeDoc plugin for Brunch.

'use strict';

const debug = require('debug')('brunch:typedoc');
const td = require('typedoc');

class TypeDoccer
{
  // Brunch constructs an instance of TypeDoccer when the plugin is loaded and
  // it supplies the entire Brunch config object.
  constructor(brunchCfg)
  {
    // Find our portion of the config.
    const cfg = (brunchCfg
                 && brunchCfg.plugins
                 && brunchCfg.plugins.typedoc
                 ? brunchCfg.plugins.typedoc
                 : {});

    // We require either the 'out' or 'json' options, but not both.
    if (cfg.hasOwnProperty('out') && cfg.hasOwnProperty('json'))
    {
      debug("Cannot specify both 'out' and 'json' options");
      throw new Error('invalid config');
    }
    if (! cfg.hasOwnProperty('out') && ! cfg.hasOwnProperty('json'))
    {
      debug("Must specify either 'out' or 'json' option");
      throw new Error('invalid config');
    }

    // TypeDoc complains if the options we give it contain the 'out', 'json'
    // or 'version' fields.
    //
    // We remove and remember 'out' and 'json'.
    this.out = cfg.out;
    delete cfg.out;

    this.json = cfg.json;
    delete cfg.json;

    // We ignore and remove 'version'
    if (cfg.hasOwnProperty('version'))
    {
      debug("Ignoring 'version' option");
      delete cfg.version;
    }

    // We always supply our own logger function, clobbering anything specified
    // in the cfg.
    cfg.logger = (msg, level) => { debug(`[${level}] ${msg}`); }
    
    // Make a new TypeDoc instance with the given config options.
    this.typedoc = new td.Application(cfg);
  }

  // Run TypeDoc over the TypeScript source files included in brunchFiles, and
  // generate the docs.
  onCompile(brunchFiles)
  {
    // Translate the array of Brunch files into an array of bare filenames.
    const files = brunchFiles.map((file) => { return file.path; });

    // Generate the docs.
    let result;
    
    // Generate HTML docs if 'out' was specified.
    if (this.out !== undefined)
    {
      result = this.typedoc.generateDocs(files, this.out);
    }
    // Otherwise, assume 'json' was specified and generate JSON files.
    else
    {
      result = this.typedoc.generateJson(files, this.json);
    }

    // Detect errors.  The details would have already been emitted by the
    // logging function.
    if (! result || this.typedoc.hasErrors())
    {
      throw new Error(`failed to generate docs`);
    }

    // Success.
    debug(`Generated docs for ${files.length} source files`);
  }
}

// Tell Brunch that we are a plugin, and we handle code source files.
//
// The presence of an onCompile() function on TypeDoccer tells Brunch to
// execute that function after a successful compilation run.
//
TypeDoccer.prototype.brunchPlugin = true;
TypeDoccer.prototype.type = 'javascript';

module.exports = TypeDoccer;

// *********************************************************************
