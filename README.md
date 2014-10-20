Starting with:

* https://github.com/TONEnoTONE/Tone.js/
* http://cssdeck.com/labs/responsive-hexagonal-grid

== Git notes

Included `Tone.js` as a subtree, using the following command (via http://blogs.atlassian.com/2013/05/alternatives-to-git-submodule-git-subtree/):

```
git subtree add --prefix src/script/lib/tone.js https://github.com/TONEnoTONE/Tone.js.git master --squash
```

If we need to update `Tone.js` in the future we can use the following command.

```
git subtree pull --prefix src/script/lib/tone.js https://github.com/TONEnoTONE/Tone.js.git master --squash
```