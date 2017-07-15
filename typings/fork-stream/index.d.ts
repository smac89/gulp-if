declare module 'fork-stream' {
    import {DuplexOptions, Readable, Writable} from 'stream';

    namespace ForkStream {
        interface ForkStreamOptions extends DuplexOptions {
            classifier: Classifier;
        }
    }

    class ForkStream extends Writable {
        readonly a: Readable;
        readonly b: Readable;
        constructor(opts?: ForkStream.ForkStreamOptions);
    }

    export = ForkStream;
}

interface Classifier {
    (data: any, cb: (err: Error, taken: boolean) => any): any;
}
