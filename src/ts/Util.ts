export interface Comparable<T> {
    compareTo(o: T): number;
}

export interface Stringifiable {
    toString(): string;
}

export abstract class DataObject {
    get [Symbol.toStringTag](): string {
        return this.constructor.name;
    }
}

// non-recursive
export function binarySearch<T, U, R>(a: Array<T>, lo: number, hi: number, item: U,
                                      compare: BiFunction<U, T, number>,
                                      consume: UnaryFunction<T, R>): R {
    while(lo < hi) {
        const mid = Math.floor(lo + (hi - lo) / 2), re = compare(item, a[mid]);
        if(re === 0)
            return consume(a[mid]);
        if(re < 0)
            hi = mid;
        else
            lo = mid + 1;
    }

    return null;
}

export interface Action<R> {
    (): R;
}

export interface UnaryFunction<T, R> {
    (t: T): R;
}

export interface BiFunction<T, U, R> {
    (t: T, u: U): R;
}
