export interface Comparable<T> {
    compareTo(o: T): number;
}

export const compareFunction = <T extends Comparable<T>>(l: T, r: T): number => l.compareTo(r);

export abstract class DataObject {
    get [Symbol.toStringTag](): string {
        return this.constructor.name;
    }

    equals(o: DataObject): boolean {
        return this === o;
    }
}

export const rgb = (r: number, g: number, b: number): string =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

// non-recursive
export function binarySearch<T, U, R>(a: Array<T>, lo: number, hi: number, item: U,
                                      compare: BiFunction<U, T, number>,
                                      consumeIndex: Function<number, R>): R {
    while(lo < hi) {
        const mid = Math.floor(lo + (hi - lo) / 2), re = compare(item, a[mid]);
        if(re === 0)
            return consumeIndex(mid);
        if(re < 0)
            hi = mid;
        else
            lo = mid + 1;
    }

    return undefined;
}

export interface Action<R> {
    (): R;
}

export interface Function<T, R> {
    (t: T): R;
}

export interface BiFunction<T, U, R> {
    (t: T, u: U): R;
}