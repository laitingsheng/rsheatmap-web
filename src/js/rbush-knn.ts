/*
Copyright (c) 2016, Vladimir Agafonkin

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

Originally from package rbush-knn. Rewrite in TypeScript with minor changes by Tinson
 */

'use strict';

import rbush from 'rbush';
import tinyqueue from 'tinyqueue';

export function knn(tree: rbush, x: number, y: number, maxDistance: number,
                    n?: number): number {
    let node = tree.data, result = 0;
    const queue = new tinyqueue(null, compareDist);

    while(node) {
        for(let i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            let dist = boxDist(x, y, child);
            if(dist <= maxDistance) {
                queue.push({
                               node: child,
                               isItem: node.leaf,
                               dist: dist
                           });
            }
        }

        while(queue.length && queue.peek().isItem) {
            queue.pop();
            result += 1;
            if(n && result === n)
                return result;
        }

        node = queue.pop();
        if(node)
            node = node.node;
    }

    return result;
}

function compareDist(a: any, b: any) {
    return a.dist - b.dist;
}

function boxDist(x: number, y: number, box: any) {
    let dx = axisDist(x, box.minX, box.maxX),
        dy = axisDist(y, box.minY, box.maxY);
    return dx * dx + dy * dy;
}

function axisDist(k: number, min: number, max: number) {
    return k < min ? min - k :
        k <= max ? 0 :
            k - max;
}

export default knn;
