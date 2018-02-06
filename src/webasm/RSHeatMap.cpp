#include "RSHeatMap.h"
#include <emscripten.h>

RSHeatMap::RSHeatMap() {
    EM_ASM(
        alert('test');
    );
}
