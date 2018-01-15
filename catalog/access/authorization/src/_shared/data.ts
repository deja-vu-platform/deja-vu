export interface Resource {
    atom_id: string;
    owner: Principal;
    viewers: Principal[];
};

export interface Principal {
    atom_id: string;
};
