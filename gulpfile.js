"use strict";

const baseName = 'drei-'

/* paths configuration */
var path = {
    build: {
        html: "./dist/",
        js: "./dist/js/",
        css: "./dist/css/",
        img: "./dist/img/",
        fonts: "./dist/fonts/",
        fontIcons: "./dist/fonts/",
    },
    src: {
        html: "./src/*.html",
        // js: ["./src/js/main.js"],
        style: "./src/style/main.scss",
        fontIcons: "./src/font_icons/icons/*.svg",
        img: [
            "./src/img/**/*.*",
        ],
        fonts: [
            "./src/fonts/**/*.*",
        ]
    },
    watch: {
        html: "./src/**/*.html",
        js: "./src/js/**/*.js",
        css: "./src/style/**/*.scss",
        img: "./src/img/**/*.*",
        fonts: "./srs/fonts/**/*.*",
        fontIcons: "./src/font_icons/icons/*.svg",
    },
    clean: ["./dist/*", "./release/*"],
    release: {
        src: "./dist/**/*",
        themeFolder: './release/tmp/theme',
        archiveSrc: './release/tmp/**/*',
        target: "./release",
    }
};

const conf = require('./conf.json');

/* Gulp config */
const sass = require('gulp-sass')(require('sass'));
const gulp = require("gulp"),
    minify = require("gulp-minify"),
    webserver = require("browser-sync"),
    plumber = require("gulp-plumber"),
    rigger = require("gulp-rigger"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    cleanCSS = require("gulp-clean-css"),
    cache = require("gulp-cache"),
    rimraf = require("gulp-rimraf"),
    iconfont = require('gulp-iconfont'),
    iconfontCss = require('gulp-iconfont-css'),
    rename = require("gulp-rename"),
    rtlcss = require('gulp-rtlcss'),
    zip = require('gulp-zip'),
    chmod = require('gulp-chmod'),
    gulpEach = require('gulp-each'),
    gulpRename = require('gulp-rename'),
    gulpDelete = require('gulp-delete-file');

/* Main tasks */

/**
 * Start a web server
 */
gulp.task("webserver", function() {
    webserver(conf.webServerConf);
});

/**
 * Build html
 */
gulp.task("html:build", function() {
    return gulp
        .src(path.src.html)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(webserver.reload({ stream: true }));
});

/**
 * Replace system blocks, like footerBlock in the dest html
 */
gulp.task("replace:sys-blocks", function() {
    return gulp.src(path.build.html + "*")
        .pipe(gulpEach(function(content, file, callback) {
            let updatedContent = content;

            conf.devReplacements.forEach((item) => {
                let textPos = updatedContent.search(item.name);

                while (textPos >= 0) {
                    updatedContent = updatedContent.replace(item.name, item.value);
                    textPos = updatedContent.search(item.name);
                }
            })
            callback(null, updatedContent);
        }))
        .pipe(gulp.dest(path.build.html));
});

/**
 * Builds the svg icons to font
 */
gulp.task('fonticons:build', function() {
    const fontName = 'IconsFont';
    return gulp.src([path.src.fontIcons])
        .pipe(iconfontCss({
            fontName: fontName,
            path: './src/font_icons/templates/_icons.scss',
            targetPath: '../../src/style/theme/_icons.scss',
            fontPath: '../fonts/'
        }))
        .pipe(iconfont({
            fontName: fontName,
            fontHeight: 2000,
            centerVertically: true,
            normalize: true,
            formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
        }))
        .pipe(gulp.dest(path.build.fontIcons));
});


/**
 * Build styles
 */
gulp.task("css:build-ltr", function() {
    return gulp
        .src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass({
            includePaths: [
                './node_modules',
            ]
        })) // scss -> css
        .pipe(autoprefixer())
        .pipe(gulp.dest(path.build.css))
        .pipe(rename({ suffix: ".min" }))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(path.build.css));
});

gulp.task("css:build-rtl", function() {
    return gulp
        .src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass({
            includePaths: [
                './node_modules',
            ]
        })) // scss -> css
        .pipe(rtlcss())
        .pipe(rename({ suffix: ".rtl" }))
        .pipe(gulp.dest(path.build.css))
        .pipe(rename({ suffix: ".min" }))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(path.build.css))
        .pipe(webserver.reload({ stream: true }));
});

gulp.task("css:build", gulp.series(gulp.parallel("css:build-ltr", "css:build-rtl")));


/**
 * Build js
 */
// gulp.task("js:build", function() {
//     return gulp
//         .src(path.src.js)
//         .pipe(plumber())
//         .pipe(rigger())
//         .pipe(gulp.dest(path.build.js))
//         .pipe(sourcemaps.init())
//         .pipe(
//             minify({
//                 ext: {
//                     min: ".min.js",
//                 },
//                 ignoreFiles: ["-min.js"],
//             })
//         )
//         .pipe(sourcemaps.write("./"))
//         .pipe(gulp.dest(path.build.js))
//         .pipe(webserver.reload({ stream: true }));
// });

/**
 * Copy fonts
 */
gulp.task("fonts:build", function() {
    return gulp
        .src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

/**
 * Process images
 */
gulp.task("image:build", function() {
    return gulp
        .src(path.src.img)
        .pipe(gulp.dest(path.build.img));
});

/**
 * Clean build
 */
gulp.task("clean:build", function() {
    return gulp.src(path.clean, { read: false }).pipe(rimraf());
});

/**
 * Clean the cache
 */
gulp.task("cache:clear", function() {
    cache.clearAll();
});

/**
 * Main build task
 */
gulp.task(
    "build",
    gulp.series(
        "clean:build",
        gulp.parallel(
            "html:build",
            "css:build",
            // "js:build",
            "fonts:build",
            "image:build",
            "fonticons:build",
        )
    )
);

/**
 * Watch task
 */
gulp.task("watch", function() {
    gulp.watch(path.watch.html, gulp.series("html:build", "replace:sys-blocks"));
    gulp.watch(path.watch.css, gulp.series("css:build"));
    // gulp.watch(path.watch.js, gulp.series("js:build"));
    gulp.watch(path.watch.img, gulp.series("image:build"));
    gulp.watch(path.watch.fonts, gulp.series("fonts:build"));
    gulp.watch(path.watch.fontIcons, gulp.series("fonticons:build"));
});

/**
 * prepare tmp folder
 */
gulp.task("zip:tmp", function() {
    return gulp
        .src(path.release.src)
        .pipe(gulp.dest(path.release.themeFolder))
});

function killOthers(regexp) {
    return gulp.src(path.release.themeFolder + '/*.html')
        .pipe(gulpDelete({
            reg: regexp,
            deleteMatch: false
        }))
}

function createArchive(name) {
    return gulp
        .src(path.release.archiveSrc)
        .pipe(chmod(0o777, 0o777))
        .pipe(zip(name))
        .pipe(gulp.dest(path.release.target));
}

function makeCopy(srcName, destBaseName) {
    return gulp.src(path.release.themeFolder + '/' + srcName)
        .pipe(gulpRename(function(path) {
            path.basename = destBaseName;
        }))
        .pipe(gulp.dest(path.release.themeFolder));
}


gulp.task("zip:index", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'index-template.zip')
    }
))

gulp.task("zip:index-black", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|index_black\.html/);
    },
    function() {
        return makeCopy('index_black.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'index-black-template.zip')
    }
))


gulp.task("zip:arrow", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|arrow\.html/);
    },
    function() {
        return makeCopy('arrow.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'arrow-template.zip')
    }
))

gulp.task("zip:arrow-black", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|arrow_black\.html/);
    },
    function() {
        return makeCopy('arrow_black.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'arrow-black-template.zip')
    }
))


gulp.task("zip:steps", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|steps\.html/);
    },
    function() {
        return makeCopy('steps.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'steps-template.zip')
    }
))

gulp.task("zip:steps-mind", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|steps_mind\.html/);
    },
    function() {
        return makeCopy('steps_mind.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'steps-mind-template.zip')
    }
))

gulp.task("zip:arrow-playwing", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|arrow_playwing\.html/);
    },
    function() {
        return makeCopy('arrow_playwing.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'arrow-playwing-template.zip')
    }
))

gulp.task("zip:steps-black", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|steps_black\.html/);
    },
    function() {
        return makeCopy('steps_black.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'steps-black-template.zip')
    }
))

gulp.task("zip:dimoco-playwing-download", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|dimoco_playwing_download\.html/);
    },
    function() {
        return makeCopy('dimoco_playwing_download.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'dimoco-playwing-download-template.zip')
    }
))

gulp.task("zip:arrow-payment", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|arrow_payment\.html/);
    },
    function() {
        return makeCopy('arrow_payment.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'arrow-payment_template.zip')
    }
))

gulp.task("zip:arrow-playwing-payment", gulp.series('zip:tmp',
    function() {
        return killOthers(/\/$|arrow_playwing_payment\.html/);
    },
    function() {
        return makeCopy('arrow_playwing_payment.html', 'index')
    },
    function() {
        return killOthers(/\/$|index\.html/);
    },
    function() {
        return createArchive(baseName + 'arrow-playwing-payment-template.zip')
    }
))

/**
 * Creates the release archive
 */
gulp.task("release", gulp.series(
    "clean:build",
    "build",
    "zip:index",
    "zip:index-black",
    "zip:arrow",
    "zip:arrow-black",
    "zip:steps",
    "zip:steps-black",
    "zip:steps-mind",
    "zip:arrow-playwing",
    "zip:dimoco-playwing-download",
    "zip:arrow-payment",
    "zip:arrow-playwing-payment"
));

/**
 * Default task
 */
gulp.task("default", gulp.series("build", "replace:sys-blocks", gulp.parallel("webserver", "watch")));