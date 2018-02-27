export interface Comparable<T> {
    compareTo(o: T): number;
}

export interface Hashable {
    hash(): number;
}

export const compareFunction = <T extends Comparable<T>>(l: T, r: T): number => l.compareTo(r);
export const compareNumber = (l: number, r: number): number => l - r;

export function compareArray<L, R>(cmp: (l: L, r: R) => number,
                                   ...indices: Array<number>): (l: Array<L>,
                                                                r: Array<R>) => number {
    return (l, r) => {
        const ll = l.length, rl = r.length;

        for(const i of indices) {
            if(ll !== rl) {
                if(i >= ll)
                    return -1;
                if(i >= rl)
                    return 1;
            }

            const re = cmp(l[i], r[i]);
            if(re)
                return re;
        }

        return 0;
    };
}

export const hash = (h: Hashable): number => h.hash();

export abstract class DataObject {
    // default conversion
    get [Symbol.toStringTag](): string {
        return this.constructor.name;
    }

    equals(o: DataObject): boolean {
        return this === o;
    }
}

export abstract class ComparableDataObject<E extends ComparableDataObject<E>> extends DataObject
    implements Comparable<E> {
    abstract compareTo(o: E): number;

    equals(o: E): boolean {
        return !this.compareTo(o);
    }
}

export const rgb = (r: number, g: number, b: number): string =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

// non-recursive
function _binarySearch<T, U, R>(a: Array<T>, lo: number, hi: number, item: U,
                                cmp: (l: U, r: T) => number,
                                consumeIndex: (index: number) => R,
                                failIndex?: (index: number) => R): R {
    while(lo < hi) {
        const mid = Math.floor(lo + (hi - lo) / 2), re = cmp(item, a[mid]);
        if(re === 0)
            return consumeIndex(mid);
        if(re < 0)
            hi = mid;
        else
            lo = mid + 1;
    }

    return failIndex ? failIndex(lo) : undefined;
}

export const binarySearch = <T, U, R>(a: Array<T>, item: U, cmp: (l: U, r: T) => number,
                                      consumeIndex: (index: number) => R,
                                      failIndex?: (index: number) => R) =>
    _binarySearch(a, 0, a.length, item, cmp, consumeIndex, failIndex);

// for approximate precision
export function compareRealNumber(a: number, b: number): boolean {
    const diff = Math.abs(a - b);
    if(diff < 1e-10)
        return true;
    return diff <= 1e-8 * Math.max(Math.abs(a), Math.abs(b));
}

// refer to TypeScript documentation
export function Mixin(derive: any, ...bases: any[]): void {
    bases.forEach(
        base => Object.getOwnPropertyNames(base.prototype).forEach(
            name => derive.prototype[name] = base.prototype[name]
        )
    );
}
