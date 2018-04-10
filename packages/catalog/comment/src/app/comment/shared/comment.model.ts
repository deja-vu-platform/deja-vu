export interface Author {
    id: string;
}

export interface Target {
    id: string;
}

export interface Comment {
    id: string;
    author: Author;
    target: Target;
    content: string;
}
