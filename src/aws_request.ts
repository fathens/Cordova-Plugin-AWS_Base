
export interface AWS_Request<T> {
    send(callback: (err, data: T) => void): void;
}

export async function aws_request<R>(request: AWS_Request<R>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
        request.send((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
