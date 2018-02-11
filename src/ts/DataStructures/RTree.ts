/*
* Replace the rbush module, completely rewrite in TypeScript with enhanced OO pattern
* Refer to https://github.com/mourner/rbush
*/

import Bound2D from './Bound2D';
import { BiFunction } from './Util';

class RNode<Box extends Bound2D> {
    entries: Array<RNode<Box>>;
    height: number;
    leaf: boolean;

    minBound(lo: number, hi: number, applyInPlace?: boolean): RNode<Box> {
        let node: RNode<Box>;
        if(applyInPlace)
            node = this;
        else
            node = new RNode<Box>(<Box>this.box.newArbitraryBound());

        for(let i = lo; i < hi; ++i)
            node.box.extend(node.entries[i].box);

        return node;
    }

    constructor(public box: Box, entries?: Array<RNode<Box>>) {
        this.height = 1;
        this.leaf = true;

        if(entries)
            this.entries = entries;
        else
            this.entries = [];
    }
}

export class RTree<Box extends Bound2D> {
    private maxEntries: number;
    private minEntries: number;
    private root: RNode<Box>;

    insert(box: Box): void {
        if(!this.root)
            this.root = new RNode(box);

        let node = this.root, level = this.root.height - 1, path = [], minArea, minEnlarge,
            targetNode = null;

        // select the subtree to be inserted
        while(true) {
            path.push(node);

            if(node.leaf || path.length - 1 === level)
                break;

            minArea = minEnlarge = Infinity;
            node.entries.forEach(child => {
                let area = child.box.area, enlarge = box.enlargedArea(child.box);

                if(enlarge < minEnlarge) {
                    minEnlarge = enlarge;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;
                } else if(enlarge === minEnlarge)
                    if(area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
            });

            node = targetNode || node.entries[0];
        }

        // insert the node
        node.entries.push(new RNode(box));
        node.box.extend(box);

        // split node and propagate upwards if needed
        while(level >= 0)
            if(path[level].entries.length > this.maxEntries) {
                node = path[level];
                const m = this.minEntries, M = node.entries.length;

                // sort entries by best axis

                if(level)
                    path[level - 1].entries.push(nnode);
                else
                    this.splitRoot(node, nnode);

                --level;
            } else
                break;
    }

    constructor(maxEntries?: number) {
        this.maxEntries = Math.max(9, maxEntries);
        this.minEntries = Math.ceil(this.maxEntries * 0.4);
        this.root = null;
    }

    // total margin of all split distributions
    private allDistMargin(node: RNode<Box>, m: number, M: number,
                          compare: BiFunction<RNode<Box>, RNode<Box>, number>): number {
        node.entries.sort(compare);

        let left = node.minBound(0, m), right = node.minBound(M - m, M);

        return undefined;
    }

    private splitRoot(root: RNode<Box>, node: RNode<Box>): void {
        this.root = new RNode(<Box>root.box.combine(node.box));
        this.root.entries = [root, node];
        this.root.height = node.height + 1;
        this.root.leaf = false;
    }
}

export default RTree;
