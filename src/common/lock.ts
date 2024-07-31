// the TL;DR for why this lock needs to exist is because the database api is not async safe without it
// source: https://jackpordi.com/posts/locks-in-js-because-why-not
type Cont = () => void;

export class Lock {
  private readonly queue: Cont[] = [];
  private acquired = false;

  public async acquire(): Promise<void> {
    if (!this.acquired) {
      this.acquired = true;
    } else {
      return new Promise<void>((resolve, _) => {
        this.queue.push(resolve);
      });
    }
  }

  public async release(): Promise<void> {
    if (this.queue.length === 0 && this.acquired) {
      this.acquired = false;
      return;
    }

    const continuation = this.queue.shift();
    return new Promise((res: Cont) => {
      continuation!();
      res();
    });
  }
}
