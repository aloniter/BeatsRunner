// Object Pool for reusable Three.js groups
// Reduces GC pressure by recycling objects instead of create/dispose
class ObjectPool {
    constructor(factoryFn, resetFn) {
        this._pool = [];
        this._factory = factoryFn;
        this._reset = resetFn;
    }

    acquire() {
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        return this._factory();
    }

    release(obj) {
        this._reset(obj);
        this._pool.push(obj);
    }

    prewarm(count) {
        for (let i = 0; i < count; i++) {
            this._pool.push(this._factory());
        }
    }

    dispose(disposeFn) {
        this._pool.forEach(obj => disposeFn(obj));
        this._pool.length = 0;
    }

    get size() {
        return this._pool.length;
    }
}
