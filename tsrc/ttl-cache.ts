interface TTLObject<K> {
    timeout: number;
    key: K;
}

export class TTLCache<K, V> extends Map<K,V> {
    private tid: any;
    private cleanUpKey: K | null = null;
    private intervals: TTLObject<K>[] = [];

    constructor (public ttl: number) {
        super();
    }

    public set(key: K, value: V) {
        if (super.has(key)) {
            const index = this.intervals.findIndex((interval) => interval.key === key);
            if (index !== -1) {
                this.intervals.splice(index, 1);
                if (this.tid && this.cleanUpKey === key) {
                    clearInterval(this.tid);
                    this.tid = null;
                    this.cleanUpKey = null;
                }
            }
        }
        super.set(key, value);
        this.intervals.push({
            timeout: Date.now() + this.ttl,
            key,
        });
        this.cleanUP();
        return this;
    }

    private cleanUP() {
        if (!this.tid) {
            if (this.cleanUpKey) {
                super.delete(this.cleanUpKey);
                this.tid = null;
                this.cleanUpKey = null;
            }
            if (this.intervals.length > 0) {
                const ttlObj = this.intervals.shift() as TTLObject<K>;
                this.cleanUpKey = ttlObj.key;
                this.tid = setTimeout(() => {
                    this.tid = null;
                    this.cleanUP();
                }, Math.max(0, ttlObj.timeout - Date.now()));
            }
        }
    }
}
