import { DataObject } from './Util';

class BTNode<T> extends DataObject {
    readonly children: Array<BTNode<T>>;
    readonly entries: Array<T>;
    readonly maxEntries: number;
    size: number;

    forEach(callback: (v: T) => void): void {
        let i: number;
        for(i = 0; i < this.size; ++i) {
            // traverse children first
            const c = this.children[i];
            if(!this.leaf)
                c.forEach(callback);
            callback(this.entries[i]);
        }

        // last child
        if(!this.leaf)
            this.children[i].forEach(callback);
    }

    insert(item: T): void {
        let i = this.size - 1;

        // if current is leaf then find a slot to insert
        if(this.leaf) {
            // move the tail one slot backwards and search the appropriate slot for current item
            while(i >= 0 && this.cmp(this.entries[i], item) > 0) {
                this.entries[i + 1] = this.entries[i];
                --i;
            }
            this.entries[i + 1] = item;
            ++this.size;
        } else {
            // insert into the child first
            while(i >= 0 && this.cmp(this.entries[i], item) > 0)
                --i;

            // if the child is full, split
            if(this.children[i + 1].size === this.maxEntries) {
                this.splitChild(i + 1);

                // compare the key pushed from child node and adjust position
                if(this.cmp(this.entries[i + 1], item) < 0)
                    ++i;
            }
            this.children[i + 1].insert(item);
        }
    }

    search(item: T): boolean {
        let i = 0, re: number;
        // find the first entry <= item
        while(i < this.size && (re = this.cmp(item, this.entries[i])) > 0)
            ++i;

        if(re === 0)
            return true;

        // if current is leaf then it does not exist
        if(this.leaf)
            return false;

        // propagate searching to the child
        return this.children[i].search(item);
    }

    splitChild(pos: number): void {
        const y = this.children[pos], z = new BTNode(y.minEntries, y.leaf, y.cmp);

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
                private cmp: (l: T, r: T) => number) {
        super();

        this.maxEntries = 2 * minEntries - 1;
        this.entries = new Array(this.maxEntries);
        this.children = new Array(this.maxEntries + 1);
        this.size = 0;
    }
}

export class BTree<T> extends DataObject {
    private root: BTNode<T>;

    forEach(callback: (v: T) => void): void {
        if(this.root)
            this.root.forEach(callback);
    }

    insert(item: T): void {
        if(!this.root) {
            this.root = new BTNode(this.minEntries, true, this.cmp);
            this.root.entries[0] = item;
            ++this.root.size;
            return;
        }

        if(this.root.size === this.root.maxEntries) {
            // create a new root and split the original root
            const n = new BTNode(this.minEntries, false, this.cmp);
            n.children[0] = this.root;
            n.splitChild(0);

            let i = 0;
            if(this.cmp(n.entries[0], item) < 0)
                ++i;
            n.children[i].insert(item);

            this.root = n;
        } else
            this.root.insert(item);
    }

    search(item: T): boolean {
        return this.root.search(item);
    }

    constructor(private cmp: (l: T, r: T) => number, readonly minEntries: number = 4) {
        super();
    }
}
