/*
MIT License

Copyright (c) 2016 Vladimir Agafonkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Originally from package rbush. Rewrite (partially, some unused functions are ignored) to adapt to
current Project in TypeScript by Tinson
 */

'use strict';

class RNode {
    children: Array<RNode>;
    height: number;
    leaf: boolean;
    bound: [number, number, number, number] | google.maps.LatLngBounds;

    constructor(children: Array<RNode>) {
        this.children = children;
        this.height = 1;
        this.leaf = true;
        this.bound = [Infinity, Infinity, -Infinity, -Infinity];
    }
}

export class RTreeMap {
    private minEntries: number;
    private maxEntries: number;

    public constructor(maxEntries: number) {
        this.maxEntries = Math.max(4, maxEntries || 9);
        this.minEntries = Math.max(2, Math.ceil(this.maxEntries * 0.4));
    }
}
