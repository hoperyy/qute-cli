# What's this?

It's a cute cli tool for developers.

It can help front-end engineers start project without configuring webpack or others.

For now, this tool focus on fe developing.

# All Qute Orders

## qute docsite-*

demo: https://hoperyy.github.io/knowledge-map

+   orders

    +   `qute docsite-serve [targetPath] [-m, --multi] [-i, --show-index]`

        Lanch current directory as a website.

        +   `[-m, --multi]`

            Each subdirectory will be lanched as a single website by default

        +   `[-i, --show-index]`

            If dirname matches `/^\d*-/`, such as `0-README.md`, the site will not show `0-` but show README by default.

            If you want to show `0-`, just add this param.

        +   `[targetPath]`

            target directory. `./` by default.

    +   `qute docsite-push [branch] [-m, --multi] [-i, --show-index]`**(beta and take care!)**

        It will push current directory to github.

        +   `branch`

            The target remote git branch. `gh-pages` by default.

        +   `[-m, --multi]`

            Each subdirectory will be pushed as a single website by default.

        +   `[-i, --show-index]`

            If dirname matches `/^\d*-/`, such as `0-README.md`, the site will not show `0-` but show README by default.

            If you want to show `0-`, just add this param.

+   config files

    +   `.repo` Tell docsite what is this project's repo
    +   `.sidebarshowignore` files that should not be shown in sidebar (It will be reached by url)
    +   `.sidebarfileignore` files that should not be created when creating docsite website (It will not be reached by url)
    +   `.navbarignore` files that should not be shown in navbar
    +   `README.md` project readme.
    +   `_sidebar.md` user defined sidebar. Only work in default mode, not `--multi` mode
    +   `_navbar.md` user defined navbar. Only work in default mode, not `--multi` mode

# CHANGELOG

+   1.0.1

    update readme

+   1.0.0

    first publish

# LICENSE

MIT

