
function padStars(str?: string) {
    const size = 75;
    if (typeof str === 'string')
        return '* ' + str.padStart(str.length + Math.floor((size - str.length) / 2), ' ').padEnd(size, ' ') + ' *';

    else
        return ''.padStart(size + 4, '*');
}

export const PRINT_COLORS = {
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    Reset: "\x1b[0m"
};

function printf(color: string, str?: string) {
    console.log(color, padStars(str), PRINT_COLORS.Reset);
}

export function printBox(color: string, arr: string[]) {
    printf(color);
    arr.forEach(function (str) {
        printf(color, str);
    });
    printf(color);
}
