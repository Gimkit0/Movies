let _has = Object.prototype.hasOwnProperty
  , hasProperty = (e, t) => _has.call(e, t);
function _hasTTLExpired(e) {
    return (new Date).getTime() > Number(e)
}
function _setTTL(e, t="minute") {
    if (!["day", "hour", "minute", "second"].includes(t))
        throw new Error("period not supported, use any of day /hour/ minute/ second");
    var r = Number(e)
      , a = new Date;
    switch (t) {
    case "day":
        a.setHours(a.getHours() + 24 * r);
        break;
    case "hour":
        a.setHours(a.getHours() + r);
        break;
    case "minute":
        a.setMinutes(a.getMinutes() + r);
        break;
    default:
        a.setSeconds(a.getSeconds() + r)
    }
    return a.getTime()
}
let _hashstr = t => {
    let r = 0;
    if (0 != t.length)
        for (let e = 0; e < t.length; e++) {
            var a = t.charCodeAt(e);
            r = (r << 5) - r + a,
            r &= r
        }
    return r
}
  , storageBox = (r="localStorage", a=void 0) => {
    let o = window.localStorage;
    switch (r) {
    case "localStorage":
        return o = window.localStorage,
        {
            get: async e => o.getItem(e),
            set: (e, t) => o.setItem(e, t),
            remove: e => o.removeItem(e),
            clear: () => o.clear()
        };
    case "sessionStorage":
        return o = window.sessionStorage,
        {
            get: async e => o.getItem(e),
            set: (e, t) => o.setItem(e, t),
            remove: e => o.removeItem(e),
            clear: () => o.clear()
        };
    case "AsyncStorage":
        if (void 0 === a)
            throw new Error("required storage instance missing");
        return {
            get: async e => {
                try {
                    return await a.getItem(e)
                } catch (e) {
                    throw new Error("error reading value from " + r)
                }
            }
            ,
            set: async (e, t) => {
                try {
                    return await a.setItem(e, t),
                    !0
                } catch (e) {
                    throw new Error("saving error " + r)
                }
            }
            ,
            remove: async e => {
                try {
                    await a.removeItem(e)
                } catch (e) {
                    throw new Error("error removing data from " + r)
                }
            }
            ,
            clear: () => a.clear()
        };
    default:
        return o = window.localStorage,
        {
            get: async e => o.getItem(e),
            set: (e, t) => o.setItem(e, t),
            remove: e => o.removeItem(e),
            clear: () => o.clear()
        }
    }
}
  , cacheManager = (r, e, a, o=null) => {
    if (!hasProperty(r, "mode") || !["block", "allow"].includes(r.mode))
        throw new Error("accepted modes: block | allow");
    if (!hasProperty(r, "matchIn") && !hasProperty(r, "endsWith"))
        throw new Error("malformed config");
    let s = storageBox(r.driver, r.disk)
      , n = _hashstr(e + ":" + a).toString();
    return {
        should: function() {
            if (null !== o)
                return o;
            let t = !1;
            return "block" === r.mode ? (t = !0,
            hasProperty(r, "matchIn") && r.matchIn.includes(a) && (t = !1),
            hasProperty(r, "endsWith") && r.endsWith.forEach(e => {
                a.endsWith(e) && (t = !1)
            }
            )) : (t = !1,
            hasProperty(r, "matchIn") && r.matchIn.includes(a) && (t = !0),
            hasProperty(r, "endsWith") && r.endsWith.forEach(e => {
                a.endsWith(e) && (t = !0)
            }
            )),
            t
        },
        has: function(e) {
            return !(null === e || _hasTTLExpired(JSON.parse(e).ttl) && (this.delete(),
            1))
        },
        store: function(e, t=r.defaultTTL) {
            if (!this.should())
                return !1;
            t = t.split(" "),
            t = _setTTL(t[0], t[1]);
            s.set(n, JSON.stringify(Object.assign({
                data: e,
                ttl: t
            })))
        },
        get: async () => s.get(n),
        select: async function() {
            var e;
            return null !== o && !1 === o ? (this.delete(),
            !1) : (e = await this.get(),
            !!this.has(e) && JSON.parse(e).data)
        },
        delete: () => {
            s.remove(n)
        }
        ,
        flushAll: () => {
            s.clear()
        }
    }
}
;
var _initCachedFetch = function(n, c) {
    return async function(e, t, r) {
        let a = {
            headers: c
        }
          , o = (a = Object.assign(a, r),
        null)
          , s = (hasProperty(a, "keep-cache") && (o = a["keep-cache"]),
        cacheManager(n, e, t, o));
        r = await s.select();
        return r ? (e = new Response(r),
        Promise.resolve(e)) : fetch(t, a).then(e => {
            var t;
            return 200 <= e.status && e.status < 300 && (t = e.headers.get("Content-Type")) && (t.match(/application\/json/i) || t.match(/text\//i)) && e.clone().text().then(e => {
                var t = hasProperty(a, "cacheTTL") ? a.cacheTTL : n.defaultTTL;
                s.store(e, t)
            }
            ),
            e
        }
        )
    }
};
let isJsonString = function(e) {
    try {
        JSON.parse(e)
    } catch (e) {
        return !1
    }
    return !0
};
for (let e = 0; e < localStorage.length; e++) {
    let t = localStorage.key(e)
      , r = localStorage.getItem(t);
    if (isJsonString(r)) {
        let e = JSON.parse(r);
        "object" == typeof e && e.hasOwnProperty("ttl") && _hasTTLExpired(e.ttl) && localStorage.removeItem(t)
    }
}
