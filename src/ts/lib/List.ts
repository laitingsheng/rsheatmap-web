import { DataObject, Mixin } from './Util';

export class LNode<T> {
    constructor(public data: T, public prev: LNode<T>, public next: LNode<T>) {
    }
}

export abstract class Linked<T> extends DataObject {
    protected first: LNode<T>;
    protected last: LNode<T>;
    protected _size: number;

    get size(): number {
        return this._size;
    }

    back(): T {
        return this.last ? this.last.data : null;
    }

    pushBack(item: T): void {
        if(this.last) {
            this.last.next = new LNode<T>(item, this.last, null);
            this.last = this.last.next;
        } else
            this.first = this.last = new LNode<T>(item, null, null);
    }

    constructor() {
        super();
        this.first = this.last = null;
    }
}

export class Stack<T> extends Linked<T> {
    popBack(): T {
        if(!this.last)
            return null;

        const tmp = this.last.data;
        if(this.last.prev) {
            this.last.prev.next = null;
            this.last = this.last.prev;
        } else
            this.first = this.last = null;
        --this._size;
        return tmp;
    }
}

export class Queue<T> extends Linked<T> {
    popFront(): T {
        if(!this.first)
            return null;

        const tmp = this.first.data;
        if(this.first.next) {
            this.first.next.prev = null;
            this.first = this.first.next;
        } else
            this.first = this.last = null;
        --this._size;
        return tmp;
    }

    front(): T {
        return this.first ? this.first.data : null;
    }
}

function merge<T>(l: LNode<T>, r: LNode<T>, cmp: (l: T, r: T) => number): LNode<T> {
    // left node is exhausted, concat the rest of the right node
    if(!l)
        return r;
    // similarly
    if(!r)
        return l;

    let result: LNode<T>;
    if(cmp(l.data, r.data) <= 0) {
        // left node in the front
        result = l;
        result.next = merge(l.next, r, cmp);
    } else {
        // right node in the front
        result = r;
        result.next = merge(l, r.next, cmp);
    }

    // correct the link to previous node
    result.next.prev = result;
    return result;
}

// close (both inclusive) interval
export function linkedMergeSort<T>(start: LNode<T>, end: LNode<T>,
                                   cmp: (l: T, r: T) => number): LNode<T> {
    if(start === null || start === end)
        return start;

    // find the middle node, equivalent to Math.ceil(array.length / 2)
    let l: LNode<T> = start, r: LNode<T> = end;
    while(l !== r && l.next !== r) {
        l = l.next;
        r = r.prev;
    }
    const midNext = l.next;
    l.next = null;

    // as in normal array merge sort
    l = linkedMergeSort(start, l, cmp);
    r = linkedMergeSort(midNext, end, cmp);
    l = merge(l, r, cmp);

    // reset link to the previous node of head of list
    l.prev = null;
    return l;
}

// doubly linked list
export class List<T> extends Linked<T> implements Stack<T>, Queue<T> {
    front: () => T;
    popBack: () => T;
    popFront: () => T;

    forEach(callback: (value: T, index: number) => void): void {
        let curr = this.first, i = 0;
        while(curr !== null) {
            callback(curr.data, i++);
            curr = curr.next;
        }
    }

    get(index: number): T | never {
        let curr = this.first, i = 0;
        while(curr) {
            if(i++ === index)
                return curr.data;
            curr = curr.next;
        }

        throw 'index out of range';
    }

    map(callback: (value: T, index: number) => any): Array<any> {
        let curr = this.first, re: Array<any> = [], i = 0;
        while(curr !== null) {
            re.push(callback(curr.data, i++));
            curr = curr.next;
        }
        return re;
    }

    pushFront(item: T): void {
        if(this.first) {
            this.first.prev = new LNode<T>(item, null, this.first);
            this.first = this.first.prev;
        } else
            this.first = this.last = new LNode<T>(item, null, null);
        ++this._size;
    }

    search(item: T): boolean {
        let curr = this.first;
        while(curr) {
            if(this.equal(item, curr.data))
                return true;
            curr = curr.next;
        }

        return false;
    }

    set(index: number, item: T): void | never {
        let curr = this.first, i = 0;
        while(curr) {
            if(i++ === index) {
                curr.data = item;
                return;
            }
            curr = curr.next;
        }

        throw 'index out of range';
    }

    // in-place merge sort, approx. O(2 * n log n + n) = O(n log n)
    sort(cmp: (l: T, r: T) => number): void {
        let curr = this.first = linkedMergeSort(this.first, this.last, cmp);

        // reset the tail the list
        while(curr.next)
            curr = curr.next;
        this.last = curr;
    }

    toArray(): Array<T> {
        return this.map(x => x);
    }

    toString(): string {
        let re = `[`, curr = this.first;
        while(curr && curr.next) {
            re += `${curr.data} `;
            curr = curr.next;
        }
        if(curr)
            re += curr.data.toString();
        re += ']';
        return re;
    }

    constructor(private equal: (l: T, r: T) => boolean = (l, r) => l === r) {
        super();
    }
}

Mixin(List, Stack, Queue);

export class SortedList<T> extends List<T> {
    pushBack(item: T): void {
        if(this.last) {
            let curr = this.last;
            while(curr && this.cmp(item, curr.data) <= 0)
                curr = curr.prev;
            if(curr) {
                const next = curr.next;
                curr.next = new LNode(item, curr, next);
                if(next)
                    next.prev = curr.next;
                else
                    this.last = curr.next;
            } else {
                this.first.prev = new LNode<T>(item, null, this.first);
                this.first = this.first.prev;
            }
        } else
            this.first = this.last = new LNode<T>(item, null, null);
        ++this._size;
    }

    pushFront(item: T): void {
        if(this.first) {
            let curr = this.first;
            while(curr && this.cmp(item, curr.data) >= 0)
                curr = curr.next;
            if(curr) {
                const prev = curr.prev;
                curr.prev = new LNode(item, prev, curr);
                if(prev)
                    prev.next = curr.prev;
                else
                    this.first = curr.prev;
            } else {
                this.last.next = new LNode<T>(item, this.last, null);
                this.last = this.last.next;
            }
        } else
            this.first = this.last = new LNode<T>(item, null, null);
        ++this._size;
    }

    set(): never {
        throw 'operation not supported';
    }

    // call to this function will incur the change of comparison function used currently
    sort(cmp: (l: T, r: T) => number) {
        this.cmp = cmp;
        super.sort(cmp);
    }

    constructor(private cmp: (l: T, r: T) => number) {
        super((l, r) => cmp(l, r) === 0);
    }
}

export default List;
