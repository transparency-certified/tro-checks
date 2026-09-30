# Ensuring safe usage of JSON-LD constructs

The expectations in Tier 2, `SAFE-JSON-LD`, aim to ensure that TROs employ only those
JSON-LD constructs that work consistently in all of the JSON-LD processors we support.
Three of them, `non-null-context-is-object-string-or-array`, `graph-array-of-objects` and
`ids-and-types-strings`, flag documents that are not JSON-LD at all. Each of the rest flags
a construct the JSON-LD standard allows but the supported processors do not all handle as
the standard specifies.

The evidence is the W3C
[JSON-LD to RDF test suite](https://w3c.github.io/json-ld-api/tests/toRdf-manifest.html)
(`w3c/json-ld-api` at `ffdb326`, 2026-08-12), run through the three processors the
[README](../README.md#supported-parsers-and-processors) lists. Each row of the table below gives a
construct, the W3C tests that use it and that some of the supported processors fail, and
the TRO expectation that ensures the inconsistent behavior is avoided. A W3C test that uses more than one of these constructs is
listed under each.

<table>
<thead>
<tr><th align="left">Construct</th><th align="left">W3C tests failed by some processors</th><th align="left">TRO expectation</th></tr>
</thead>
<tbody>
<tr><td><code>@context</code> below the top</td><td><code>tc013</code>–<code>tc015</code> <code>tc018</code> <code>tc025</code> <code>tc032</code> <code>tc033</code> <code>tc037</code> <code>tc038</code> <code>ter56</code> <code>tpr01</code> <code>tpr03</code>–<code>tpr05</code> <code>tpr08</code> <code>tpr09</code> <code>tpr11</code> <code>tpr12</code> <code>tpr17</code> <code>tpr18</code> <code>tpr20</code> <code>tpr21</code> <code>tpr25</code> <code>tpr26</code> <code>tpr40</code> <code>tpr43</code> <code>tso06</code> <code>tso07</code></td><td nowrap><samp>context-at-root-only</samp></td></tr>
<tr><td><code>@container</code></td><td><code>tc013</code> <code>tc025</code> <code>te004</code> <code>te079</code>–<code>te084</code> <code>te093</code>–<code>te098</code> <code>te102</code>–<code>te105</code> <code>te107</code> <code>te108</code> <code>tem01</code> <code>ter17</code> <code>ter20</code> <code>ter21</code> <code>ter35</code> <code>ter42</code> <code>tli11</code> <code>tli12</code> <code>tli14</code> <code>tm013</code>–<code>tm016</code> <code>tm020</code> <code>tpi01</code> <code>tpi03</code>–<code>tpi05</code> <code>tpi11</code> <code>tpr25</code> <code>tpr26</code> <code>tpr31</code> <code>tpr32</code> <code>tpr43</code></td><td nowrap><samp>context-containers-absent</samp></td></tr>
<tr><td><code>@vocab</code></td><td><code>tc013</code>–<code>tc015</code> <code>tc018</code> <code>tc037</code> <code>tc038</code> <code>te081</code>–<code>te084</code> <code>te088</code> <code>te092</code> <code>te095</code>–<code>te098</code> <code>te102</code>–<code>te105</code> <code>te107</code> <code>te108</code> <code>te110</code>–<code>te112</code> <code>te117</code> <code>te118</code> <code>te120</code> <code>te124</code> <code>te125</code> <code>ten01</code>–<code>ten04</code> <code>ter08</code> <code>ter49</code> <code>tin07</code>–<code>tin09</code> <code>tm013</code>–<code>tm016</code> <code>tm020</code> <code>tpi01</code>–<code>tpi05</code> <code>tpi11</code> <code>tpr01</code> <code>tpr03</code>–<code>tpr05</code> <code>tpr08</code> <code>tpr39</code> <code>tpr40</code> <code>tso06</code> <code>tso07</code></td><td nowrap><samp>context-vocab-absent</samp></td></tr>
<tr><td><code>@protected</code></td><td><code>tpr01</code> <code>tpr03</code>–<code>tpr05</code> <code>tpr08</code> <code>tpr09</code> <code>tpr11</code> <code>tpr12</code> <code>tpr17</code> <code>tpr18</code> <code>tpr20</code> <code>tpr21</code> <code>tpr25</code> <code>tpr26</code> <code>tpr28</code> <code>tpr31</code> <code>tpr32</code> <code>tpr40</code> <code>tpr42</code> <code>tpr43</code> <code>tso07</code> <code>tso10</code></td><td nowrap><samp>context-protected-absent</samp></td></tr>
<tr><td><code>@propagate</code></td><td><code>tc029</code> <code>tc030</code> <code>tso06</code></td><td nowrap><samp>context-propagate-absent</samp></td></tr>
<tr><td><code>@import</code></td><td><code>tso01</code>–<code>tso03</code> <code>tso06</code> <code>tso07</code> <code>tso10</code> <code>tso12</code></td><td nowrap><samp>context-import-absent</samp></td></tr>
<tr><td><code>"@type": "@id"</code></td><td><code>t0028</code> <code>t0120</code>–<code>t0126</code> <code>t0128</code> <code>t0130</code>–<code>t0132</code> <code>tc025</code> <code>te007</code> <code>te020</code> <code>te021</code> <code>te088</code> <code>te117</code> <code>ter01</code> <code>ter43</code> <code>ter49</code> <code>tli11</code> <code>tli12</code> <code>tli14</code> <code>tpr25</code> <code>tpr26</code> <code>tpr43</code></td><td nowrap><samp>context-id-coercion-absent</samp></td></tr>
<tr><td><code>@graph</code> below the top</td><td><code>te020</code> <code>te021</code> <code>te081</code> <code>te084</code> <code>te095</code> <code>te098</code> <code>te102</code>–<code>te105</code></td><td nowrap><samp>graph-at-root-only</samp></td></tr>
<tr><td>A relative <code>@id</code> that is not a portable path</td><td><code>tc015</code> <code>te122</code></td><td nowrap><samp>id-segments-portable</samp></td></tr>
</tbody>
</table>
