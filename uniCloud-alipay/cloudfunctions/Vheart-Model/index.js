var R = Object.create;
var m = Object.defineProperty;
var w = Object.getOwnPropertyDescriptor;
var O = Object.getOwnPropertyNames;
var k = Object.getPrototypeOf,
	x = Object.prototype.hasOwnProperty;
var D = (r, t, e, n) => {
	if (t && typeof t == "object" || typeof t == "function")
		for (let o of O(t)) !x.call(r, o) && o !== e && m(r, o, {
			get: () => t[o],
			enumerable: !(n = w(t, o)) || n.enumerable
		});
	return r
};
var S = (r, t, e) => (e = r != null ? R(k(r)) : {}, D(t || !r || !r.__esModule ? m(e, "default", {
	value: r,
	enumerable: !0
}) : e, r));
var E = uniCloud.database(),
	l = E.collection("vheart-model-users"),
	a = class {
		static async findByAccount(t) {
			let e = await l.where({
				account: t
			}).get();
			return e.data && e.data.length > 0 ? e.data[0] : null
		}
		static async findById(t) {
			let e = await l.doc(t).get();
			return e.data && e.data.length > 0 ? e.data[0] : null
		}
		static async create(t) {
			return (await l.add(t)).id
		}
		static async update(t, e) {
			await l.doc(t).update(e)
		}
	};
var u = S(require("crypto")),
	P = "vheart-model_2026",
	g = "vheart_model_token_secret_2026",
	C = 7200 * 1e3;

function p(r) {
	return u.createHash("sha256").update(P + r).digest("hex")
}

function y(r, t) {
	return p(r) === t
}

function f(r) {
	let t = {
			userId: r,
			time: Date.now(),
			expireAt: Date.now() + C
		},
		e = Buffer.from(JSON.stringify(t)).toString("base64"),
		n = u.createHmac("sha256", g).update(e).digest("hex");
	return `${e}.${n}`
}

function h(r) {
	try {
		let [t, e] = r.split("."), n = u.createHmac("sha256", g).update(t).digest("hex");
		if (e !== n) return null;
		let o = JSON.parse(Buffer.from(t, "base64").toString());
		return Date.now() > o.expireAt ? null : o
	} catch (t) {
		return null
	}
}
var i = class {
	static async login(t) {
		let e = await a.findByAccount(t.phoneNumber);
		if (!e) throw new Error("\u7528\u6237\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u6CE8\u518C");
		if (!y(t.password, e.password)) throw new Error("\u5BC6\u7801\u9519\u8BEF");
		let n = f(e._id),
			o = JSON.parse(Buffer.from(n.split(".")[0], "base64").toString()),
			T = {
				_id: e._id,
				account: e.account,
				nickname: e.nickname,
				avatarUrl: e.avatarUrl,
				createTime: e.createTime
			};
		return {
			token: n,
			expireAt: o.expireAt,
			userInfo: T
		}
	}
	static async register(t) {
		if (await a.findByAccount(t.phoneNumber)) throw new Error("\u8BE5\u624B\u673A\u53F7\u5DF2\u6CE8\u518C");
		let n = `\u7528\u6237${t.phoneNumber.slice(-4)}`;
		return {
			_id: await a.create({
				account: t.phoneNumber,
				password: p(t.password),
				nickname: t.nickname || n,
				avatarUrl: "",
				createTime: Date.now()
			}),
			account: t.phoneNumber,
			nickname: t.nickname || n,
			avatarUrl: "",
			createTime: Date.now()
		}
	}
	static refreshToken(t) {
		let e = h(t);
		if (e === null) throw new Error("token \u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55");
		let n = f(e.userId),
			o = JSON.parse(Buffer.from(n.split(".")[0], "base64").toString());
		return {
			token: n,
			expireAt: o.expireAt
		}
	}
};

function d(r, t = "success") {
	return {
		code: 200,
		msg: t,
		data: r
	}
}

function s(r, t = 500) {
	return {
		code: t,
		msg: r,
		data: null
	}
}
var c = class {
	static async login(t) {
		try {
			let e = t;
			if (!e.phoneNumber || !e.password) return s(
				"\u624B\u673A\u53F7\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A");
			if (!/^1[3-9]\d{9}$/.test(e.phoneNumber)) return s(
				"\u624B\u673A\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E");
			let n = await i.login(e);
			return d(n, "\u767B\u5F55\u6210\u529F")
		} catch (e) {
			return console.error("[auth/login] error:", e), s(e.message || "\u767B\u5F55\u5931\u8D25")
		}
	}
	static async register(t) {
		try {
			let e = t;
			if (!e.phoneNumber || !e.password) return s(
				"\u624B\u673A\u53F7\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A");
			if (!/^1[3-9]\d{9}$/.test(e.phoneNumber)) return s(
				"\u624B\u673A\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E");
			if (e.password.length < 6) return s("\u5BC6\u7801\u81F3\u5C116\u4F4D");
			let n = await i.register(e);
			return d(n, "\u6CE8\u518C\u6210\u529F")
		} catch (e) {
			return console.error("[auth/register] error:", e), s(e.message || "\u6CE8\u518C\u5931\u8D25")
		}
	}
	static refresh(t) {
		try {
			let e = t;
			if (!e.token) return s("token \u4E0D\u80FD\u4E3A\u7A7A");
			let n = i.refreshToken(e.token);
			return d(n, "\u5237\u65B0\u6210\u529F")
		} catch (e) {
			return console.error("[auth/refresh] error:", e), s(e.message || "\u5237\u65B0\u5931\u8D25")
		}
	}
};
exports.main = async (r, t) => {
	let {
		action: e,
		data: n
	} = r;
	console.log("[Vheart-Model] event:", JSON.stringify(r)), console.log("[Vheart-Model] action:", e, "data:",
		JSON.stringify(n));
	try {
		switch (e) {
			case "auth/login":
				return await c.login(n);
			case "auth/register":
				return await c.register(n);
			case "auth/refresh":
				return c.refresh(n);
			default:
				return s(`\u672A\u77E5 action: ${e}`)
		}
	} catch (o) {
		return console.error("[Vheart-Model] uncaught error:", o), s(o.message ||
			"\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF")
	}
};