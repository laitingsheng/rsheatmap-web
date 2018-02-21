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
        if(!re)
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

    remove(key: K): V {
        // see if the key is in current node
        let i = 0, re: number;
        while(i < this.size && (re = this.cmpKey(this.entries[i].key, key)) < 0)
            ++i;

        // key is found in current node
        if(i < this.size && !re) {
            // if current is leaf, simply remove the entry and return its value
            if(this.leaf) {
                const v = this.entries[i].value;
                for(let j = i + 1; j < this.size; ++j)
                    this.entries[j - 1] = this.entries[j];
                --this.size;
                return v;
            }

            // replace current entry with the entry just precede it and recursively delete the
            // predecessors
            if(this.children[i].size >= this.minEntries) {
                let curr = this.children[i];
                while(!curr.leaf)
                    curr = curr.children[curr.size];
                this.entries[i] = curr.entries[curr.size - 1];
                return this.children[i].remove(key);
            }

            // replace current entry with the successor of it and recursively delete the successors
            if(this.children[i + 1].size >= this.minEntries) {
                let curr = this.children[i];
                while(!curr.leaf)
                    curr = curr.children[0];
                this.entries[i] = curr.entries[0];
                return this.children[i + 1].remove(key);
            }

            // if current child and next child has less entries than required, merge two children
            this.mergeRightChild(i);
            return this.children[i].remove(key);
        }

        // leaf node but key not presents, so not in tree
        if(this.leaf)
            return null;

        // test if it is in the last child
        const last = i === this.size;

        // fill the child if not enough entries
        if(this.children[i].size < this.minEntries)
            if(i && this.children[i - 1].size >= this.minEntries) {
                // borrow from previous child
                const c = this.children[i], pc = this.children[i - 1];

                // create space for insert
                let j = c.size;
                for(; j > 0; --j) {
                    c.entries[j] = c.entries[j - 1];
                    if(!c.leaf)
                        c.children[j + 1] = c.children[j];
                }
                if(!c.leaf) // last child
                    c.children[j + 1] = c.children[j];

                // pull down the entry to the head
                c.entries[j] = this.entries[i - 1];

                // adjust current child size
                ++c.size;

                // move the last child of previous child as this first child if this is not leaf
                // node
                if(!this.leaf)
                    c.children[j] = pc.children[pc.size];

                // move the last entry from previous child to this node
                this.entries[i - 1] = pc.entries[pc.size - 1];

                // adjust previous child size
                --pc.size;
            } else if(i !== this.size && this.children[i + 1].size >= this.minEntries) {
                // borrow from next child
                const c = this.children[i], nc = this.children[i + 1];

                // put the entry as the first entry of its child
                c.entries[c.size] = this.entries[i];

                // first child of next child move to the last child of current child if not leaf
                // node
                if(!c.leaf)
                    c.children[c.size + 1] = nc.children[0];

                // adjust current child size
                ++c.size;

                // insert first entry into current position
                this.entries[i] = nc.entries[0];

                // shrink space of next child
                let j = 1;
                for(; j < nc.size; ++j) {
                    nc.entries[j - 1] = nc.entries[j];
                    if(!nc.leaf)
                        nc.children[j - 1] = nc.children[j];
                }
                if(!nc.leaf) // last child
                    nc.children[j - 1] = nc.children[j];

                // adjust next child size
                --nc.size;
            } else if(!last)
                this.mergeRightChild(i);
            else
                this.mergeRightChild(i - 1);

        // test if last child was merged
        if(last && i > this.size)
            return this.children[i - 1].remove(key);

        return this.children[i].remove(key);
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

    private mergeRightChild(pos: number): void {
        // copy all data from the next node and include the entry from the current node
        const c = this.children[pos], cn = this.children[pos + 1];
        c.entries[this.minEntries - 1] = this.entries[pos];
        let i = 0;
        for(; i < cn.size; ++i) {
            c.entries[this.minEntries + i] = cn.entries[i];
            if(!c.leaf)
                c.children[this.minEntries + i] = cn.children[i];
        }
        if(!c.leaf) // last child
            c.children[this.minEntries + i] = cn.children[i];
        c.size += cn.size + 1;

        // remove the key pull down to the child, remove the node
        for(i = pos + 1; i < this.size; ++i) {
            this.entries[i - 1] = this.entries[i];
            this.children[i] = this.children[i + 1];
        }
        --this.size;
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

    // putting the value of a key is effectively equivalent to removing it but the entry will
    // not be deleted
    remove(key: K): V {
        if(!this.root)
            return null;
        let v = this.root.remove(key);

        // shrink height
        if(!this.root.size)
            if(this.root.leaf)
                this.root = null;
            else
                this.root = this.root.children[0];

        // return the old value deleted
        return v;
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
