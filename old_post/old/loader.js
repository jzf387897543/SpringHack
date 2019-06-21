/**
        Author: SpringHack - springhack@live.cn
        Last modified: 2018-10-06 16:47:24
        Filename: old/loader.js
        Description: Created by SpringHack using vim automatically.
**/
(function (window, undefined) {
	if (!window.old && (/\/\d{4}\/\d{1,2}\/\d{1,2}\/\d+/.test(location.href)))
	{
        var token = /\/\d{4}\/\d{1,2}\/\d{1,2}\/(\d+)/.exec(location.href)[1];
        var el = document.getElementById('post-body');
        var xhr = new XMLHttpRequest();
        xhr.open('get', '/old/out/' + token + '.html', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4)
            {
                window.old = true;
                console.log(xhr);
                el.innerHTML = el.innerHTML.replace('旧文章转移，点击查看详情…', xhr.responseText);
            }
        };
        xhr.send(null);
        (function () {
            this._open = this.open;
            this.open = function (_method, _url, _async) {
                if (_url.substring(0, 7) == 'http://')
                    _url = 'https://' + _url.substring(7);
                this._open(_method, _url, _async);
            };
        }).call(XMLHttpRequest.prototype);
    }
})(window);
