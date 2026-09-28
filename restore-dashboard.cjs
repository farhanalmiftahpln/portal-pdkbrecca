const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const startIndex = code.indexOf('{/* New 5 Grid Layout */}');
const endIndex = code.indexOf('</main>');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title={
                  <span>
                    Jumlah Titik <br />
                    <span className="text-[9px] text-gray-500 capitalize">
                      (Realisasi / Target)
                    </span>
                  </span>
                }
                value={\`\${stats?.realisasiTitik || 0} / \${stats?.targetTitik || 0}\`}
                icon={Activity}
                borderClass="border-blue-500"
                colorClass="text-blue-400"
              />
              <StatCard
                title={
                  <span>
                    Saving kWh <br />
                    <span className="text-[9px] text-gray-500 capitalize">
                      (Realisasi / Target)
                    </span>
                  </span>
                }
                value={\`\${stats?.savingKwh ? stats.savingKwh.toLocaleString("id-ID") : 0} / \${stats?.targetKwh ? stats.targetKwh.toLocaleString("id-ID") : 0}\`}
                icon={Zap}
                borderClass="border-yellow-500"
                colorClass="text-yellow-400"
              />
              <StatCard
                title={
                  <span>
                    Saving Rp <br />
                    <span className="text-[9px] text-gray-500 capitalize">
                      (Realisasi / Target)
                    </span>
                  </span>
                }
                value={\`Rp \${stats?.savingRp ? stats.savingRp.toLocaleString("id-ID") : 0} / \${stats?.targetRp ? stats.targetRp.toLocaleString("id-ID") : 0}\`}
                icon={DollarSign}
                borderClass="border-green-500"
                colorClass="text-green-400"
              />
              <StatCard
                title={
                  <span>
                    SAIDI / SAIFI <br />
                    <span className="text-[9px] text-gray-500 capitalize">
                      (Pencapaian)
                    </span>
                  </span>
                }
                value={\`\${stats?.saidi ? stats.saidi.toFixed(2) : "0"} / \${stats?.saifi ? stats.saifi.toFixed(2) : "0"}\`}
                icon={Lightbulb}
                borderClass="border-purple-500"
                colorClass="text-purple-400"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tren Pencapaian ULP */}
              <div className="bg-[#0d161a] p-4 rounded-xl border border-white/5 flex flex-col">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Tren Pencapaian ULP
                </h3>
                <div className="h-64 sm:h-80 w-full">
                  {stats?.chartUlpTrend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stats.chartUlpTrend.data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#ffffff10"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#ffffff50"
                          fontSize={10}
                          tickMargin={10}
                        />
                        <YAxis stroke="#ffffff50" fontSize={10} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#0d161a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: "10px", marginTop: "10px" }}
                        />
                        {stats.chartUlpTrend.ulps.map(
                          (ulpName, i) => (
                            <Line
                              key={ulpName}
                              type="monotone"
                              dataKey={ulpName}
                              stroke={COLORS[i % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                              activeDot={{ r: 5 }}
                            />
                          ),
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      Tidak ada data tren pencapaian
                    </div>
                  )}
                </div>
              </div>

              {/* Status Work Order */}
              <div className="bg-[#0d161a] p-4 rounded-xl border border-white/5 flex flex-col">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Status Work Order
                </h3>
                <div className="h-64 sm:h-80 w-full">
                  {stats?.chartStatus && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.chartStatus}
                        margin={{
                          top: 10,
                          right: 10,
                          left: -20,
                          bottom: 80,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#ffffff10"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#ffffff50"
                          fontSize={9}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis stroke="#ffffff50" fontSize={10} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#0d161a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {stats.chartStatus.map(
                            (entry, index) => (
                              <Cell
                                key={\`cell-\${index}\`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#0d161a] p-4 rounded-xl border border-white/5 flex flex-col">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Distribusi SOP & Kategori
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 h-auto">
                  <div className="h-[300px] relative bg-transparent">
                    <h4 className="text-[10px] text-gray-500 absolute top-0 left-0 w-full text-center">
                      SOP PEKERJAAN
                    </h4>
                    <div className="pt-6 h-full">
                      {stats?.chartSop && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart
                            margin={{ top: 0, right: 0, bottom: 40, left: 0 }}
                          >
                            <Pie
                              data={stats.chartSop}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.chartSop.map(
                                (entry, index) => (
                                  <Cell
                                    key={\`cell-\${index}\`}
                                    fill={COLORS[(index + 2) % COLORS.length]}
                                  />
                                ),
                              )}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#0d161a",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: "10px" }}
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="h-[300px] relative bg-transparent">
                    <h4 className="text-[10px] text-gray-500 absolute top-0 left-0 w-full text-center">
                      KATEGORI
                    </h4>
                    <div className="pt-6 h-full">
                      {stats?.chartKategori && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart
                            margin={{ top: 0, right: 0, bottom: 40, left: 0 }}
                          >
                            <Pie
                              data={stats.chartKategori}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.chartKategori.map(
                                (entry, index) => (
                                  <Cell
                                    key={\`cell-\${index}\`}
                                    fill={COLORS[(index + 4) % COLORS.length]}
                                  />
                                ),
                              )}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#0d161a",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: "10px" }}
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Recent WOs */}
              <div className="bg-[#0d161a] rounded-xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0f12]/50">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    List Realisasi Work Order
                  </h3>
                </div>
                <div className="overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead className="text-gray-500 font-bold border-b border-white/5">
                      <tr>
                        {stats?.recentWOs?.headers ? (
                          stats.recentWOs.headers.map((h, i) => (
                            <th
                              key={i}
                              className="py-2 px-3 uppercase tracking-tighter"
                            >
                              {h}
                            </th>
                          ))
                        ) : (
                          <>
                            <th className="py-2 px-3 uppercase tracking-tighter">
                              ID WO
                            </th>
                            <th className="py-2 px-3 uppercase tracking-tighter">
                              Tanggal
                            </th>
                            <th className="py-2 px-3 uppercase tracking-tighter">
                              ULP
                            </th>
                            <th className="py-2 px-3 uppercase tracking-tighter">
                              Status
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.isArray(stats?.recentWOs) &&
                        stats.recentWOs
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((wo, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-gray-300 font-mono text-primary">
                                {wo.id}
                              </td>
                              <td className="py-2.5 px-3 text-gray-300">
                                {formatDate(wo.tanggal)}
                              </td>
                              <td className="py-2.5 px-3 text-gray-300">
                                {wo.ulp}
                              </td>
                              <td className="py-2.5 px-3 text-gray-300">
                                {wo.status}
                              </td>
                            </tr>
                          ))}
                      {paginatedData.map((row, rIdx) => (
                        <tr
                          key={\`v2-\${rIdx}\`}
                          className="hover:bg-white/5 transition-colors"
                        >
                          {row.map((val, cIdx) => {
                            const h =
                              stats?.recentWOs?.headers?.[cIdx]?.toUpperCase() ||
                              "";
                            const isDateList = h.includes("TANGGAL");
                            return (
                              <td
                                key={cIdx}
                                className="py-2.5 px-3 text-gray-300"
                              >
                                {cIdx === 0 ? (
                                  <span className="font-mono text-primary">
                                    {String(val)}
                                  </span>
                                ) : isDateList ? (
                                  formatDate(val)
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {(!stats?.recentWOs ||
                        (Array.isArray(stats.recentWOs)
                          ? stats.recentWOs.length === 0
                          : !stats.recentWOs.data ||
                            stats.recentWOs.data.length === 0)) && (
                        <tr>
                          <td
                            colSpan={stats?.recentWOs?.headers?.length || 4}
                            className="px-6 py-8 text-center text-sm text-gray-500"
                          >
                            Belum ada data work order. Pastikan script GAS
                            sudah di-deploy ulang.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-white/5 bg-[#0a0f12]/50">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs rounded text-gray-300 transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-gray-500">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs rounded text-gray-300 transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
`;
  const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/pages/Dashboard.tsx', newCode);
  console.log("Restored Dashboard.tsx successfully.");
} else {
  console.log("Could not find start or end index.");
}
