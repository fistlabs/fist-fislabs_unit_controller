fist-fistlabs_unit_controller [![Build Status](https://travis-ci.org/fistlabs/fist-fistlabs_unit_controller.svg)](https://travis-ci.org/fistlabs/fist-fistlabs_unit_controller)
========================

Fist plugin providing abstract controller

##Basic usage:

```js
//  app.js
var app = fist({
    unitSettings: {
        _fistlabs_unit_controller: {
            viewsDir: '/views',
            engines: {
                //   as module name
                '.jade': 'jade',
                // as consolidate signature function
                '.dust': require('consolidate').dust
            }
        }
    }
});
app.install('fist-fistlabs_unit_controller');
// fist_plugins/units/controllers/news.js
app.unit({
    base: '_fistlabs_unit_controller',
    name: 'news',
    rule: 'GET /news/',
    defaultName: 'index.jade',
    deps: ['user_info', 'news_list']
});
```

##Settings
You can configure base controller unit with ```params.unitSettings```

###```String viewsDir=app.params.root+'views'```
The directory name view names will be resolved from

###```Object engines={}```
The dictionary which provides extname->engine relation
Supports extensions as ```bemhtml.js```, in fact it is the substring from end of view file name.
The value may be as string and [consolidate.js](https://www.npmjs.com/package/consolidate) template signature convention function

##API:

```_fistlabs_unit_controller``` unit a also provides some api to make your controllers smarter.

###```String unit.defaultViewName```
Default view name

###```String unit.lookupViewName(track, context)```
Should return template name, returns ```unit.defaultViewName``` by default.

###```Number unit.createResponseStatus(track, context)```
Should return response status code for current request. Returns 200 by default

###```Object unit.createResponseHeader(track, context)```
Should create response header dictionary. Returns
```js
{
    'Content-Type': 'text/html; charset="UTF-8"'
}
```
as default

###```Object unit.createViewOpts(track, context)```
Should create an object which provides view options. See [consolidate.js](https://www.npmjs.com/package/consolidate)

###```String unit.rule```
Router rule to automatic assign the unit with request pattern

---------
LICENSE [MIT](LICENSE)
