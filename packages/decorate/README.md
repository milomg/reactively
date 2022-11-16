# Reactively

Reactively is a library for fine grained reactive programming.

See [documentation](https://github.com/modderme123/reactively#readme])
for details.

This part of the library (`@reactively/decorate`)
contains annotations for using reactively in classes.

```ts
/* A lightweight reactive program can look almost like regular javascript programming.
*
* This example uses a class, with a few @reactive annotations added.
* (Reactively can be used without classes too)
*
* Here's the dataflow relationship between the reactive parts:
*    size -> bufferBlocks -> buffer
*/
class ResizeableBuffer extends HasReactive {
  @reactively size = 0;
  @reactively get blocks() { return Math.ceil(this.size / 2 ** 12); }
  @reactively get buffer(): any {
    const newBuf = Buffer.allocUnsafe(this.blocks * 2 ** 12);
    this._buf && newBuf.copy(this._buf);
    return (this._buf = newBuf);
  }
  private _buf: any;

}

const b = new ResizeableBuffer();
b.size = 10 ** 5;

/* Here we call buffer() twice. In an imperative system we'd allocate twice
  * which is inefficient. A reactive system will allocate only once.  */
b.buffer.fill(-1);
b.buffer.setAt(0, 100);

/* A reactive system can find other efficiencies. Here's one example: */

b.size += 1; // grow the number of elements, but blocks doesn't change
b.buffer; // no new buffer allocated here!
```
