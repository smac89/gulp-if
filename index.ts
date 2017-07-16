import {PassThrough, Readable} from 'stream';
import * as gutil from 'gulp-util';
import * as Vinyl from 'vinyl';
import * as ForkStream from 'fork-stream';
import {IOptions as MinimatchOpts} from 'minimatch';
import * as util from "util";
const match = require('gulp-match');

function If(params: GulpIfOpts, opts?: MinimatchOpts): GulpIfBranch;
function If(condition: Condition, opts?: MinimatchOpts): GulpIf;
function If (paramsOrCondition: GulpIfOpts | Condition, opts?: MinimatchOpts): NodeJS.ReadWriteStream | GulpIf {
    if (typeof paramsOrCondition === 'object' && isGulpIfOpts(paramsOrCondition)) {
        let {condition, thenStream, elseStream} = paramsOrCondition;
        if (elseStream) {
            return new GulpIf(condition, opts).then(thenStream).otherwise(elseStream);
        }
        return new GulpIf(condition, opts).then(thenStream);
    } else {
        return new GulpIf(paramsOrCondition, opts);
    }

    function isGulpIfOpts(arg: any): arg is GulpIfOpts {
        return 'condition' in arg && 'thenStream' in arg;
    }
}

class GulpIf {
    constructor(private _condition: Condition, private _opts?: MinimatchOpts) {}

    public then(stream: ThunkStream, ...args: any[]): GulpIfBranch {
        let boundThunk = stream;
        if (typeof stream !== 'function') {
            if (args.length) {
                throw new gutil.PluginError('GulpIf',
                    'The stream must be a function to apply the arguments', {showStack: true});
            }
        } else {
            boundThunk = stream.bind(stream, ...args);
        }
        return new GulpIfBranch(this._condition, boundThunk, this._opts);
    }
}

class GulpIfBranch extends PassThrough {
    private _elseStream: ThunkStream;
    private forkStream: ForkStream;

    constructor(private _condition: Condition, private _thenStream: ThunkStream, opts?: MinimatchOpts) {
        super({ objectMode: true });

        this.forkStream = new ForkStream({
            classifier: (data: any, cb: (err: Error, taken: boolean) => void) => {
                cb(null, !!match(data, this._condition, opts));
            }
        });
        this.forkStream.a.once('data', (content: any) => {
            this.removeListener('pipe', this.fixPlumbing);
            this.forkStream.a.pipe(this.thenStream).pipe(this);
            this.forkStream.a.unshift(content);
            this.on('pipe', this.fixPlumbing);
        });

        this.forkStream.b.once('data', (content: any) => {
            this.removeListener('pipe', this.fixPlumbing);
            this.forkStream.b.pipe(this.elseStream).pipe(this);
            this.forkStream.b.unshift(content);
            this.on('pipe', this.fixPlumbing);
        });

        this._elseStream = new PassThrough({objectMode: true});
        this.on('pipe', this.fixPlumbing);
        this.once('finish', () => this.forkStream.end());
    }

    public otherwise(stream: ThunkStream, ...args: any[]): this {
        let boundThunk = stream;
        if (typeof stream !== 'function') {
            if (args.length) {
                throw new gutil.PluginError('GulpIf',
                    'The stream must be a function to apply the arguments', {showStack: true});
            }
        } else {
            boundThunk = stream.bind(stream, ...args);
        }
        this._elseStream = boundThunk;
        return this;
    }

    /**
     * Used to correct the stream and ensures that each branch is
     * evaluated lazily and only as needed
     * @param src The source readable which is piping to this
     */
    private fixPlumbing(src: Readable) {
        src.unpipe(this).pipe(this.forkStream);
        this.straightPipe();
    }

    /**
     * Override the _read method to provide a source to read from
     * @param size The suggested size to read
     * @private
     */
    public _read(size: number) {
        let source = this.condition ? this.thenStream : this.elseStream;

        this.removeListener('pipe', this.fixPlumbing);
        source.pipe(this).on('pipe', this.fixPlumbing);

        this.straightPipe();
    }

    public _write(chunk: any, enc: string, cb: Function) {
        this.forkStream.write(chunk, enc, cb);
    }

    /**
     * Evaluate and return the result of the condition
     * @returns {boolean}
     */
    private get condition(): boolean {
        return !!this._condition;
    }

    /**
     * Evaluate and return the value of the thenStream
     * @returns {ThunkStream}
     */
    private get thenStream(): NodeJS.ReadWriteStream {
        if (typeof this._thenStream === 'function') {
            this.emit('then');
            this._thenStream = this._thenStream();
        }
        return this._thenStream;
    }

    /**
     * Evaluate and return the value of the elseStream
     * @returns {ThunkStream}
     */
    private get elseStream(): NodeJS.ReadWriteStream {
        if (typeof this._elseStream === 'function') {
            this.emit('else');
            this._elseStream = this._elseStream();
        }
        return this._elseStream;
    }

    /**
     * To be called if there is a pipeline to this stream to ensure
     * the read and writes are free of any side effects introduced in those methods
     */
    private straightPipe() {
        let writeMethod = this._write;
        let readMethod = this._read;

        this._write = super._write;
        this._read = super._read;

        this.once('finish', () => {
            this._read = readMethod;
            this._write = writeMethod;
        });
    }
}

type Condition = boolean | StatCondition | ((vf: Vinyl) => boolean) | string | RegExp;
type ThunkStream = NodeJS.ReadWriteStream | ((...args: any[]) => NodeJS.ReadWriteStream);

interface StatCondition {
    isFile?: boolean;
    isDirectory?: boolean;
}

interface GulpIfOpts {
    readonly condition: Condition;
    readonly thenStream: NodeJS.ReadWriteStream;
    readonly elseStream?: NodeJS.ReadWriteStream;
}

namespace If {}

export = If;
