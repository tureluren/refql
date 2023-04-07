const castAs = (cast?: string, as?: string) =>
  `${cast ? `::${cast}` : ""}${as ? ` "${as}"` : ""}`;

export default castAs;