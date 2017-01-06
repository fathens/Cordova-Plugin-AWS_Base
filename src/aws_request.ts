
export interface AWS_Request {
    send(callback: (err, data) => void): void;
}

export async function aws_request<R>(request: AWS_Request): Promise<R> {
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
