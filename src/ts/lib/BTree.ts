import { Comparable } from './Util';
import { SortedList } from './List';

export class BTNode<T> {
    entries: SortedList<T>;
    parent: BTNode<T>;
    children: Array<BTNode<T>>;
    private _size: number;

    get size(): number {
        return this._size;
    }

    constructor(numEntries: number, private cmp: (l: T, r: T) => number) {
        this.entries = new SortedList(cmp);
        this.children = new Array(numEntries + 1);
        this._size = 0;
    }
}

function defaultSplit<T>(node: BTNode<T>): BTNode<T> {
    return null;
}

export class BTree<T extends Comparable<T>> {
    readonly maxEntries: number;
    private root: BTNode<T>;

    constructor(maxEntries?: number,
                private split: Consumer<BTNode<T>, BTNode<T>> = defaultSplit) {
        // defaults to 4 if not specified
        this.maxEntries = maxEntries ? maxEntries : 4;
        this.root = new BTNode(this.maxEntries);
    }

    private recurseInsert(node: BTNode<T>, item: T) {
        if(node.size === this.maxEntries)
            }
}