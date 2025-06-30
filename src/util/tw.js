require('dotenv').config();

// Configura los colores en la variable tw_colors
let tw_colors = {};
for (let color of process.env.TW_WIDGET_COLORS.split('|')) {
    tw_colors[color] = color;
}

/**
 * Obtiene TW_WIDGET_COLOR desde archivo .env
 */
function get_selected_color() {
    let color = process.env.TW_WIDGET_COLOR.toLowerCase();

    if (!Object.keys(tw_colors).includes(color))
        throw Error(`[.env:TW_WIDGET_COLOR] ¡Color '${color}' desconocido!`);

    return color;
}

module.exports = {
    colors: tw_colors,
    get_color: get_selected_color
};