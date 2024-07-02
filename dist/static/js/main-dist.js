function blockInput(e){$("button").each((function(n,t){$(t).attr("disabled",e)})),e?($("#reloadAll").off("click"),$("#reloadAll span").removeClass("click")):($("#reloadAll span").addClass("click"),$("#reloadAll").on("click",(function(){printMessage("Loading records and config."),flushTable(),loadAll()})))}function printMessage(e,n="hsl(207, 64%, 38%)"){$("#statusText").html(e),$("#statusText").css({color:n})}function deletRecord(e){const n=e;printMessage("Deleting: "+n,"yellow"),jQuery.ajax({url:"/delete",type:"POST",data:JSON.stringify({name:n}),contentType:"application/json; charset=utf-8",success:function(e){printMessage(n+" deleted.")},error:function(e){printMessage("Error: No record found.","red")},complete:function(){loadAll()}})}function playRecord(e){const n=e;printMessage("Transmitting: "+n,"yellow"),jQuery.ajax({url:"/play",type:"POST",data:JSON.stringify({name:n}),contentType:"application/json; charset=utf-8",success:function(e){printMessage(n+" transmitted.")},error:function(e){printMessage("Error! No record found.","red")}})}function insertTableRow(e,n,t){const o=e,r=n,a=$("#dataTableBody"),c=$("<tr></tr>"),l=[o,r,null],s=["Play","Delete"];let i=[],d=[];!0===t&&c.addClass("new");for(let e=0;e<=2;e++)null!==l[e]?i.push($("<td></td>").text(l[e])):i.push($("<td></td>"));for(let e=0;e<=1;e++)d.push($("<button></button>").text(s[e]));d[0].click((function(){playRecord(r)})),d[1].click((function(){if(1!=confirm("Delete record\n"+r+"?"))return!1;deletRecord(r)})),d.forEach(((e,n,t)=>{i[2].append(e)})),i.forEach(((e,n,t)=>{c.append(e)})),a.append(c)}function flushTable(){$("#dataTableBody").empty()}function recordSignal(){let e=$("#recordName").val();printMessage("Recording: Waiting for "+e+".","yellow"),jQuery.ajax({url:"/record",type:"POST",data:JSON.stringify({name:e}),contentType:"application/json; charset=utf-8",success:function(n){printMessage(e+" recorded."),$("#recordName").val(""),loadRecords(e)},error:function(e){printMessage("Error! No signal detected.","red")}})}function loadRecords(e,n){jQuery.ajax({url:"/data",type:"GET",dataType:"json",success:function(n){if(0===Object.keys(n).length)return printMessage("No records found.","red"),!1;flushTable(),Object.keys(n).forEach(((n,t)=>{insertTableRow(t+1,n,e===n)}))},error:function(e){printMessage("Error: No recorded signals available in database.","red")},complete:function(e){n&&n()}})}function loadConfig(e){jQuery.ajax({url:"/config",type:"GET",dataType:"json",success:function(e){if(0===Object.keys(e).length)return printMessage("No records found.","yellow"),!1;let n=$("#recordInfoFreeMemory"),t=$("#recordInfoFileName"),o=e.memFreePercent+"<br>";o+="("+e.memFree+"kB ",o+="of "+e.memComplete+"kB unused)",n.html(o),t.html(e.fileName)},error:function(e){printMessage("Error: No config.","red")},complete:function(n){e&&e()}})}function loadAll(e){loadRecords("None",(function(){loadConfig((function(){e&&e()}))}))}$(document).ready((function(){$("#recordForm").submit((function(e){e.preventDefault(),recordSignal()})),$(document).on("ajaxSend",(function(){blockInput(!0)})),$(document).on("ajaxStop",(function(){blockInput(!1)})),printMessage("Loading records and config."),loadAll((function(){printMessage("Ready")}))}));