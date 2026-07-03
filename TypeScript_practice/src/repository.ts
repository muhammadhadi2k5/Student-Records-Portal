export class Repository<T>{
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    getAll(): T[] {
        return this.items;
    }

    findById(id: string, getId: (item: T) => string): T | undefined {
        for (let i = 0; i < this.items.length; i++){
            const currentItem = this.items[i];
            const currentItemId = getId(currentItem);

            if (currentItemId === id){
                return currentItem;
            }
        }
        return undefined;
    }

    updateById(id: string, getId: (item: T) => string, updatedItem: T): boolean {
    for (let i = 0; i < this.items.length; i++){
        const currentItemId = getId(this.items[i]);

        if (currentItemId === id){
            this.items[i] = updatedItem;
            return true;
        }
    }
    return false;
    }

    deleteById(id: string, getId: (item: T) => string): boolean {
        for (let i = 0; i < this.items.length; i++){
            const currentItemId = getId(this.items[i]);

            if (currentItemId === id){
                this.items.splice(i, 1);
                return true;
            }
        }
        return false;
    }

}

