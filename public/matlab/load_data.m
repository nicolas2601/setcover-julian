function [A, costs] = load_data(csv_path, xlsx_path)
%LOAD_DATA Carga la matriz de cobertura (A) y el vector de costos (costs)
%   A      : matriz binaria 500x500 (filas=clientes, columnas=antenas)
%   costs  : vector 1x500 con el costo de cada antena
%
% El CSV trae header numérico (0..499) y 500 filas de datos.
% El XLSX 'Costo_S.xlsx' tiene fila 1 con etiquetas y fila 2 con costos.

    if nargin < 1 || isempty(csv_path)
        csv_path = '../set_cover_500x500.csv';
    end
    if nargin < 2 || isempty(xlsx_path)
        xlsx_path = '../Costo_S.xlsx';
    end

    % Leer matriz: readmatrix omite el header automáticamente
    A = readmatrix(csv_path);
    A = int8(A);
    [M, N] = size(A);
    fprintf('Matriz A cargada: %d filas (clientes) x %d columnas (antenas)\n', M, N);

    % Leer costos: la fila 2 del Excel, columnas 2:end
    raw = readmatrix(xlsx_path);          % readmatrix devuelve solo numéricos
    costs = raw(1, :);                    % primera fila numérica = los costos
    if size(costs, 2) ~= N
        error('Inconsistencia: %d antenas en A pero %d costos.', N, numel(costs));
    end
    fprintf('Costos cargados: min=%.0f  max=%.0f  media=%.2f\n', ...
        min(costs), max(costs), mean(costs));

    % Validar factibilidad: cada cliente cubierto por >=1 antena
    if any(sum(A, 2) == 0)
        error('Instancia INFACTIBLE: hay clientes sin cubridores.');
    end
    fprintf('Instancia factible: cada cliente tiene >=1 cubridor.\n');
end
