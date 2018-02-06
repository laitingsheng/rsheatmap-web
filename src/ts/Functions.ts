export interface Action<R> {
    (): R;
}

export interface UnaryFunction<T, R> {
    (t: T): R;
}

export interface BiFunction<T, U, R> {
    (t: T, u: U): R;
}
