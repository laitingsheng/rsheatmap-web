import { DataObject } from './Util';

class Entry<K, V> extends DataObject {
    toString(): string {
        return `[${this.key} ${this.value}]`;
    }

    constructor(readonly key: K, public value: V) {
        super();
    }
}

class BTNode<K, V> extends DataObject {
    readonly children: Array<BTNode<K, V>>;
    readonly entries: Array<Entry<K, V>>;
    readonly maxEntries: number;
    size: number;

    forEach(callback: (v: V, k: K) => void): void {
        let i = 0;
        for(; i < this.size; ++i) {
            // traverse children first
            const c = this.children[i], e = this.entries[i];
            if(!this.leaf)
                c.forEach(callback);
            callback(e.value, e.key);
        }

        // last child
        if(!this.leaf)
            this.children[i].forEach(callback);
    }

    get(key: K): V {
        let i = 0, re: number;
        // find the first entry <= item
        while(i < this.size && (re = this.cmpKey(key, this.entries[i].key)) > 0)
            ++i;

        // identical key then return value
        if(re === 0)
            return this.entries[i].value;

        // if current is leaf then it does not exist
        if(this.leaf)
            return null;

        // propagate searching to the left child since key < entry.key
        return this.children[i].get(key);
    }

    merge(key: K, value: V, remap: (old: V, curr: V) => V): V {
        return this.insert(key, value, e => e.value = remap(e.value, value));
    }

    put(key: K, value: V): V {
        return this.insert(key, value, e => {
            const tmp = e.value;
            e.value = value;
            return tmp;
        });
    }

    splitChild(pos: number): void {
        const y = this.children[pos], z = new BTNode<K, V>(y.minEntries, y.leaf, y.cmpKey);

        // cut the original node into two halves
        for(let i = 0; i < y.minEntries - 1; ++i)
            z.entries[i] = y.entries[i + y.minEntries];
        if(!y.leaf)
            for(let i = 0; i < y.minEntries; ++i)
                z.children[i] = y.children[i + y.minEntries];
        z.size = y.size = y.minEntries - 1;

        // insert new child split from original node
        for(let i = this.size; i > pos; --i)
            this.children[i + 1] = this.children[i];
        this.children[pos + 1] = z;

        // push the middle entry from original node to the given pos
        for(let i = this.size - 1; i >= pos; --i)
            this.entries[i + 1] = this.entries[i];
        this.entries[pos] = y.entries[y.minEntries - 1];
        ++this.size;
    }

    constructor(readonly minEntries: number, readonly leaf: boolean,
                private cmpKey: (l: K, r: K) => number) {
        super();

        this.maxEntries = 2 * minEntries - 1;
        this.entries = new Array(this.maxEntries);
        this.children = new Array(this.maxEntries + 1);
        this.size = 0;
    }

    private insert(key: K, value: V, exists: (entry: Entry<K, V>) => V): V {
        let i = 0, re: number, tmp;

        // search over current keys to identify the appropriate position
        while(i < this.size && (re = this.cmpKey(this.entries[i].key, key)) < 0)
            ++i;

        // duplicated key will replace and return the previous value
        if(!re)
            return exists(this.entries[i]);

        // if current is leaf then insert
        if(this.leaf) {
            tmp = this.size - 1;
            while(tmp > i) {
                this.entries[tmp + 1] = this.entries[tmp];
                --tmp;
            }
            this.entries[i] = new Entry(key, value);
            ++this.size;

            return null;
        }

        // insert into the child if non-leaf, if the child is full, split
        if(this.children[i].size === this.maxEntries) {
            this.splitChild(i);

            // compare the key pushed from child node and adjust position
            if(this.cmpKey(this.entries[i].key, key) < 0)
                ++i;
        }
        return this.children[i].insert(key, value, exists);
    }
}

export class TreeMap<K, V> extends DataObject {
    private root: BTNode<K, V>;

    forEach(callback: (v: V, k: K) => void): void {
        if(this.root)
            this.root.forEach(callback);
    }

    get(key: K): V {
        return this.root.get(key);
    }

    merge(key: K, value: V, remap: (old: V, curr: V) => V) {
        return this.insert(key, value, n => n.merge(key, value, remap));
    }

    put(key: K, value: V): V {
        return this.insert(key, value, n => n.put(key, value));
    }

    constructor(private cmpKey: (l: K, r: K) => number, readonly minEntries: number = 4) {
        super();
    }

    private insert(key: K, value: V, insertAct: (node: BTNode<K, V>) => V): V {
        // create root if not exists
        if(!this.root) {
            this.root = new BTNode(this.minEntries, true, this.cmpKey);
            this.root.entries[0] = new Entry(key, value);
            ++this.root.size;
            return value;
        }

        // if the root is full, split
        if(this.root.size === this.root.maxEntries) {
            // create a new root and split the original root
            const n = new BTNode<K, V>(this.minEntries, false, this.cmpKey);
            n.children[0] = this.root;
            this.root = n;
            n.splitChild(0);

            // insert into appropriate child
            let i = 0;
            if(this.cmpKey(n.entries[0].key, key) < 0)
                ++i;
            return insertAct(n.children[i]);
        }

        return insertAct(this.root);
    }
}

export default TreeMap;
